import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin.js";
import type { SafetyResult } from "./safety.js";

/**
 * Records a safety flag for admin review (spec §9/§83). Deliberately
 * stores only a short excerpt, not the full message/conversation — enough
 * for triage context without retaining more sensitive chat content than
 * necessary. Read access is admin-only (see firestore.rules).
 */
export async function logSafetyEvent(params: {
  uid: string;
  source: "ai_chat" | "wellbeing_assessment";
  result: SafetyResult;
  excerpt: string;
  contextId?: string;
}) {
  if (params.result.severity === "NONE") return;

  await db()
    .collection("safetyEvents")
    .add({
      uid: params.uid,
      source: params.source,
      severity: params.result.severity,
      categories: params.result.categories,
      excerpt: params.excerpt.slice(0, 200),
      contextId: params.contextId ?? null,
      status: "OPEN",
      createdAt: FieldValue.serverTimestamp(),
    });
}
