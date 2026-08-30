import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin.js";
import { tooManyRequests } from "./errors.js";

/**
 * Simple fixed-window rate limiter backed by Firestore (no Redis
 * available on this stack). Good enough for abuse/cost control at this
 * project's scale — not meant to withstand a serious distributed attack,
 * which is what Firebase App Check is for (see docs/SECURITY.md for why
 * that's documented as a follow-up rather than implemented now).
 *
 * Throws a 429 ApiError if the caller has exceeded `limit` calls to
 * `action` within the trailing `windowSeconds`.
 */
export async function enforceRateLimit(params: { uid: string; action: string; limit: number; windowSeconds: number }) {
  const ref = db().collection("rateLimits").doc(`${params.uid}_${params.action}`);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const now = Date.now();
    const windowMs = params.windowSeconds * 1000;

    if (!data || now - (data.windowStart as number) > windowMs) {
      tx.set(ref, { windowStart: now, count: 1, updatedAt: FieldValue.serverTimestamp() });
      return;
    }

    if ((data.count as number) >= params.limit) {
      throw tooManyRequests();
    }

    tx.update(ref, { count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
  });
}
