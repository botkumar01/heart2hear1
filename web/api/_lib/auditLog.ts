import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin.js";

/** Every sensitive admin action gets one of these (spec §39). */
export async function logAdminAction(params: {
  actorUid: string;
  action: string;
  targetUid?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  await db()
    .collection("adminAuditLogs")
    .add({
      actorUid: params.actorUid,
      action: params.action,
      targetUid: params.targetUid ?? null,
      reason: params.reason ?? null,
      metadata: params.metadata ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
}
