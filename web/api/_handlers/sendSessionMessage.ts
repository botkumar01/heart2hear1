import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { invalidArgument, failedPrecondition, permissionDenied } from "../_lib/errors.js";
import { classifySafety } from "../_lib/safety.js";
import { logSafetyEvent } from "../_lib/safetyEvents.js";
import { enforceRateLimit } from "../_lib/rateLimit.js";

const requestSchema = z.object({
  sessionId: z.string().min(1),
  text: z.string().trim().min(1).max(2000),
});

const HELPER_WARNING =
  "Heart2Hear helpers provide supportive listening, not medical diagnosis or treatment. Please avoid diagnosing the client, recommending medication, or giving medical instructions. Encourage the client to speak with a licensed professional instead.";

const VIOLATION_SUSPEND_THRESHOLD = 3;

/**
 * Server-side chat moderation (spec §22) — applies only to the helper's
 * outgoing messages. A blocked message is never delivered to the client;
 * repeated violations auto-suspend the helper and end the session.
 */
export default withAuth(async (req, res, decoded) => {
  await enforceRateLimit({ uid: decoded.uid, action: "sendSessionMessage", limit: 60, windowSeconds: 300 });

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { sessionId, text } = parsed.data;

  const sessionRef = db().collection("supportSessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();
  const session = sessionSnap.data();

  if (!sessionSnap.exists) throw invalidArgument("Session not found.");
  if (session?.status !== "ACTIVE") throw failedPrecondition("This session isn't active.");

  const isClient = session.clientUid === decoded.uid;
  const isHelper = session.helperUid === decoded.uid;
  if (!isClient && !isHelper) throw permissionDenied();

  const senderRole: "client" | "helper" = isHelper ? "helper" : "client";
  const messagesRef = sessionRef.collection("messages");
  const check = classifySafety(text);

  if (senderRole === "helper") {
    const isProhibited = check.categories.some((c) =>
      ["MEDICATION_ADVICE", "DIAGNOSIS_CLAIM", "DANGEROUS_INSTRUCTIONS"].includes(c),
    );

    if (isProhibited || check.severity === "CRISIS") {
      await logSafetyEvent({ uid: decoded.uid, source: "helper_chat", result: check, excerpt: text, contextId: sessionId });

      const userRef = db().collection("users").doc(decoded.uid);
      const violationCount = await db().runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        const current = (userSnap.data()?.moderationViolationCount as number | undefined) ?? 0;
        const next = current + 1;
        tx.set(userRef, { moderationViolationCount: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return next;
      });

      // Deliberately NOT written to the messages subcollection — a
      // blocked message never reaches the client's chat transcript at
      // all (not even as a placeholder), only the safety event above
      // (admin-only) and the warning returned to the helper below.

      if (violationCount >= VIOLATION_SUSPEND_THRESHOLD) {
        await db()
          .collection("users")
          .doc(decoded.uid)
          .set({ verificationStatus: "SUSPENDED", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        await sessionRef.update({ status: "SAFETY_ESCALATED", updatedAt: FieldValue.serverTimestamp() });

        res.status(200).json({
          blocked: true,
          warning: HELPER_WARNING,
          suspended: true,
        });
        return;
      }

      res.status(200).json({ blocked: true, warning: HELPER_WARNING, suspended: false });
      return;
    }
  }

  await messagesRef.add({
    senderUid: decoded.uid,
    senderRole,
    text,
    createdAt: FieldValue.serverTimestamp(),
  });

  let escalate = false;
  if (senderRole === "client" && check.severity === "CRISIS") {
    escalate = true;
    await logSafetyEvent({ uid: decoded.uid, source: "helper_chat", result: check, excerpt: text, contextId: sessionId });
    await sessionRef.update({ status: "SAFETY_ESCALATED", updatedAt: FieldValue.serverTimestamp() });
  }

  res.status(200).json({ blocked: false, escalate });
});
