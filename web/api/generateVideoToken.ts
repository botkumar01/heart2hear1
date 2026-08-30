import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { invalidArgument, failedPrecondition, permissionDenied } from "./_lib/errors.js";
import { generateZegoToken } from "./_lib/zegoToken.js";

const requestSchema = z.object({ appointmentId: z.string().min(1) });

const JOIN_WINDOW_BEFORE_MINUTES = 15;
const JOIN_WINDOW_AFTER_MINUTES = 60;

export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const snap = await db().collection("appointments").doc(parsed.data.appointmentId).get();
  const appointment = snap.data();

  if (!snap.exists) throw invalidArgument("Appointment not found.");
  if (appointment?.clientUid !== decoded.uid && appointment?.professionalUid !== decoded.uid) {
    throw permissionDenied();
  }
  if (appointment?.status !== "CONFIRMED") {
    throw failedPrecondition("This appointment isn't confirmed.");
  }

  const start = (appointment.startTime as Timestamp).toDate();
  const durationMinutes = (appointment.durationMinutes as number) ?? 30;
  const windowStart = new Date(start.getTime() - JOIN_WINDOW_BEFORE_MINUTES * 60_000);
  const windowEnd = new Date(start.getTime() + (durationMinutes + JOIN_WINDOW_AFTER_MINUTES) * 60_000);
  const now = new Date();

  if (now < windowStart || now > windowEnd) {
    throw failedPrecondition(
      `The video call opens ${JOIN_WINDOW_BEFORE_MINUTES} minutes before your scheduled time.`,
    );
  }

  const appId = Number(process.env.ZEGOCLOUD_APP_ID);
  const serverSecret = process.env.ZEGOCLOUD_SERVER_SECRET;
  if (!appId || !serverSecret) {
    throw new Error("ZEGOCLOUD isn't configured (ZEGOCLOUD_APP_ID / ZEGOCLOUD_SERVER_SECRET). See docs/VIDEO_SETUP.md.");
  }

  const token = generateZegoToken({
    appId,
    userId: decoded.uid,
    serverSecret,
    effectiveSeconds: durationMinutes * 60 + JOIN_WINDOW_AFTER_MINUTES * 60,
  });

  res.status(200).json({ token, appId, roomId: parsed.data.appointmentId, userId: decoded.uid });
});
