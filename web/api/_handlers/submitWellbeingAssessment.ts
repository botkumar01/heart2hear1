import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { invalidArgument } from "../_lib/errors.js";
import { classifySafety } from "../_lib/safety.js";
import { logSafetyEvent } from "../_lib/safetyEvents.js";

const scale = z.number().int().min(0).max(4);

const requestSchema = z.object({
  currentMood: z.enum(["good", "okay", "struggling", "very_low"]),
  stressLevel: scale,
  lonelinessLevel: scale,
  anxietyLevel: scale,
  sleepDifficulty: z.boolean(),
  pressureSources: z.array(z.enum(["academic", "work", "relationship", "family", "other"])).max(5),
  wantsToTalk: z.enum(["listen", "professional", "ai", "not_sure"]),
  feelsSafeRightNow: z.boolean(),
  shareMore: z.string().trim().max(1000).optional(),
});

export type RoutingSignal =
  | "LOW_SUPPORT_NEED"
  | "MODERATE_SUPPORT_NEED"
  | "PROFESSIONAL_SUPPORT_RECOMMENDED"
  | "SAFETY_ESCALATION";

/**
 * Produces a routing SIGNAL, never a diagnosis (spec §8) — the response
 * copy is generated on the client from this enum, not from raw scores, so
 * there's no path to accidentally rendering something diagnostic-sounding.
 */
function computeRouting(data: z.infer<typeof requestSchema>, textSeverity: string): RoutingSignal {
  if (!data.feelsSafeRightNow || textSeverity === "CRISIS") {
    return "SAFETY_ESCALATION";
  }

  const compositeScore =
    data.stressLevel + data.lonelinessLevel + data.anxietyLevel + (data.sleepDifficulty ? 1 : 0);

  if (data.wantsToTalk === "professional" || compositeScore >= 9 || data.currentMood === "very_low") {
    return "PROFESSIONAL_SUPPORT_RECOMMENDED";
  }
  if (compositeScore >= 4 || data.currentMood === "struggling") {
    return "MODERATE_SUPPORT_NEED";
  }
  return "LOW_SUPPORT_NEED";
}

export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  const data = parsed.data;

  const textCheck = data.shareMore ? classifySafety(data.shareMore) : { severity: "NONE" as const, categories: [], matchedTerms: [] };
  const routingSignal = computeRouting(data, textCheck.severity);

  const docRef = await db()
    .collection("wellbeingAssessments")
    .add({
      uid: decoded.uid,
      currentMood: data.currentMood,
      stressLevel: data.stressLevel,
      lonelinessLevel: data.lonelinessLevel,
      anxietyLevel: data.anxietyLevel,
      sleepDifficulty: data.sleepDifficulty,
      pressureSources: data.pressureSources,
      wantsToTalk: data.wantsToTalk,
      feelsSafeRightNow: data.feelsSafeRightNow,
      // Free-text is intentionally not stored verbatim beyond what the
      // safety-event excerpt captures — minimal retention (spec §8/§57).
      routingSignal,
      createdAt: FieldValue.serverTimestamp(),
    });

  if (data.shareMore) {
    await logSafetyEvent({
      uid: decoded.uid,
      source: "wellbeing_assessment",
      result: textCheck,
      excerpt: data.shareMore,
      contextId: docRef.id,
    });
  }

  res.status(200).json({ routingSignal, assessmentId: docRef.id });
});
