import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { auth, db } from "./_lib/firebaseAdmin.js";

// Raw body access is required — signature verification must run over the
// exact bytes Razorpay sent, not a re-serialized JSON.parse round-trip.
export const config = { api: { bodyParser: false } };

async function sendConfirmationEmail(appointmentId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const snap = await db().collection("appointments").doc(appointmentId).get();
  const appointment = snap.data();
  if (!appointment) return;

  const [clientUser, professionalSnap] = await Promise.all([
    auth().getUser(appointment.clientUid),
    db().collection("users").doc(appointment.professionalUid).get(),
  ]);
  if (!clientUser.email) return;

  const professionalName = professionalSnap.data()?.displayName ?? "your professional";
  const when = (appointment.startTime as Timestamp).toDate().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Heart2Hear <onboarding@resend.dev>",
      to: clientUser.email,
      subject: "Your Heart2Hear appointment is confirmed",
      html: `<p>Your consultation with ${professionalName} is confirmed for <strong>${when}</strong>.</p><p>You'll be able to join the video call from your Heart2Hear dashboard when it's time.</p>`,
    }),
  }).catch(() => undefined);
}

function readRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/**
 * Razorpay webhook — a server-to-server call, not an app-user request, so
 * it does NOT go through withAuth. Idempotent against duplicate delivery
 * (spec §64) by checking the appointment isn't already CONFIRMED before
 * acting.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured.");
    res.status(500).json({ error: "Not configured." });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-razorpay-signature"];

  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const provided = typeof signature === "string" ? signature : "";

  const signaturesMatch =
    provided.length === expected.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  if (!signaturesMatch) {
    res.status(400).json({ error: "Invalid signature." });
    return;
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id: string; notes?: Record<string, string> } } };
  };

  if (event.event !== "payment.captured") {
    // Acknowledge anything we don't act on — Razorpay retries on non-2xx.
    res.status(200).json({ received: true });
    return;
  }

  const payment = event.payload?.payment?.entity;
  const appointmentId = payment?.notes?.appointmentId;
  if (!payment || !appointmentId) {
    res.status(200).json({ received: true });
    return;
  }

  const appointmentRef = db().collection("appointments").doc(appointmentId);

  const wasConfirmedNow = await db().runTransaction(async (tx) => {
    const snap = await tx.get(appointmentRef);
    const appointment = snap.data();
    if (!snap.exists || appointment?.status !== "PENDING_PAYMENT") {
      // Already confirmed (duplicate webhook) or not in a payable state — no-op.
      return false;
    }

    tx.update(appointmentRef, {
      status: "CONFIRMED",
      razorpayPaymentId: payment.id,
      confirmedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const paymentRef = db().collection("payments").doc(payment.id);
    tx.set(paymentRef, {
      appointmentId,
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
      amountInr: appointment.feeInr,
      status: "CAPTURED",
      createdAt: FieldValue.serverTimestamp(),
    });

    return true;
  });

  if (wasConfirmedNow) {
    await sendConfirmationEmail(appointmentId).catch((err) =>
      console.error("Appointment confirmation email failed", err),
    );
  }

  res.status(200).json({ received: true });
}
