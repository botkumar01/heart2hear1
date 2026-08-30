import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin.js";

/** Session-count milestones (spec §37). Configurable-in-spirit — a fixed
 * table for now, easy to move to platformSettings later if needed. */
const SESSION_MILESTONES: Array<{ level: number; levelName: string; sessions: number }> = [
  { level: 2, levelName: "25 Completed Sessions", sessions: 25 },
  { level: 3, levelName: "50 Completed Sessions", sessions: 50 },
  { level: 4, levelName: "100 Completed Sessions", sessions: 100 },
];

export async function issueCertificate(uid: string, level: number, levelName: string) {
  const existing = await db()
    .collection("certificates")
    .where("helperUid", "==", uid)
    .where("level", "==", level)
    .limit(1)
    .get();
  if (!existing.empty) return null;

  const certificateId = randomUUID();
  await db()
    .collection("certificates")
    .doc(certificateId)
    .set({
      certificateId,
      helperUid: uid,
      level,
      levelName,
      issuedAt: FieldValue.serverTimestamp(),
    });
  return certificateId;
}

/** Called after a helper's completedSessions counter changes. */
export async function issueSessionMilestoneCertificates(uid: string, completedSessions: number) {
  for (const milestone of SESSION_MILESTONES) {
    if (completedSessions >= milestone.sessions) {
      await issueCertificate(uid, milestone.level, milestone.levelName);
    }
  }
}
