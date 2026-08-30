import { z } from "zod";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { invalidArgument, failedPrecondition, permissionDenied } from "../_lib/errors.js";

const requestSchema = z.object({ appointmentId: z.string().min(1) });

/**
 * Creates the Razorpay order server-side (never trust a frontend
 * "payment successful" message — spec §19). The client completes
 * checkout with this order id, and only razorpayWebhook.ts (verifying
 * Razorpay's signature) ever confirms the appointment.
 */
export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay isn't configured yet (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET missing). See docs/RAZORPAY_SETUP.md.",
    );
  }

  const appointmentRef = db().collection("appointments").doc(parsed.data.appointmentId);
  const snap = await appointmentRef.get();
  const appointment = snap.data();

  if (!snap.exists) throw invalidArgument("Appointment not found.");
  if (appointment?.clientUid !== decoded.uid) throw permissionDenied();
  if (appointment?.status !== "PENDING_PAYMENT") {
    throw failedPrecondition("This appointment isn't awaiting payment.");
  }
  if (appointment.razorpayOrderId) {
    // Already have an order for this appointment — reuse it rather than
    // creating a duplicate order Razorpay-side.
    res.status(200).json({ orderId: appointment.razorpayOrderId, amountInr: appointment.feeInr, keyId });
    return;
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(appointment.feeInr * 100), // paise
      currency: "INR",
      receipt: appointmentRef.id,
      notes: { appointmentId: appointmentRef.id, clientUid: decoded.uid, professionalUid: appointment.professionalUid },
    }),
  });

  if (!orderRes.ok) {
    const body = await orderRes.text().catch(() => "");
    throw new Error(`Razorpay order creation failed (${orderRes.status}): ${body.slice(0, 300)}`);
  }

  const order = (await orderRes.json()) as { id: string };
  await appointmentRef.update({ razorpayOrderId: order.id });

  res.status(200).json({ orderId: order.id, amountInr: appointment.feeInr, keyId });
});
