import { randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { assertRole } from "../_lib/roles.js";

const NONCE_TTL_MINUTES = 10;

export default withAuth(async (_req, res, decoded) => {
  assertRole(decoded, "helper");

  const nonce = `Heart2Hear wallet link\nuid: ${decoded.uid}\nnonce: ${randomBytes(16).toString("hex")}`;
  const expiresAt = Timestamp.fromMillis(Date.now() + NONCE_TTL_MINUTES * 60_000);

  await db()
    .collection("users")
    .doc(decoded.uid)
    .set({ walletNonce: nonce, walletNonceExpiresAt: expiresAt, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  res.status(200).json({ nonce });
});
