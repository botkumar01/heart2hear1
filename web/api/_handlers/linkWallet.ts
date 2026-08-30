import { verifyMessage, getAddress } from "ethers";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { assertRole } from "../_lib/roles.js";
import { invalidArgument, failedPrecondition } from "../_lib/errors.js";

const requestSchema = z.object({
  address: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * Wallet linking (spec §36): we only ever store the wallet ADDRESS, never
 * a key/seed phrase. Ownership is proven by having the wallet sign a
 * server-issued nonce (requestWalletNonce.ts) — a signature is
 * unforgeable proof of holding the private key, without that key ever
 * touching this server. Also enforces one account per wallet address.
 */
export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "helper");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  let address: string;
  try {
    address = getAddress(parsed.data.address);
  } catch {
    throw invalidArgument("That doesn't look like a valid wallet address.");
  }

  const userRef = db().collection("users").doc(decoded.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  const nonce = userData?.walletNonce as string | undefined;
  const expiresAt = userData?.walletNonceExpiresAt as Timestamp | undefined;
  if (!nonce || !expiresAt || expiresAt.toMillis() < Date.now()) {
    throw failedPrecondition("Your wallet-link request expired. Please try connecting again.");
  }

  let recovered: string;
  try {
    recovered = verifyMessage(nonce, parsed.data.signature);
  } catch {
    throw invalidArgument("Couldn't verify that signature.");
  }
  if (getAddress(recovered) !== address) {
    throw invalidArgument("Signature doesn't match the provided wallet address.");
  }

  const existing = await db().collection("wallets").where("address", "==", address).limit(1).get();
  if (!existing.empty && existing.docs[0].id !== decoded.uid) {
    throw failedPrecondition("This wallet is already linked to a different Heart2Hear account.");
  }

  await db()
    .collection("wallets")
    .doc(decoded.uid)
    .set({ address, linkedAt: FieldValue.serverTimestamp() });

  await userRef.set(
    { walletAddress: address, walletNonce: FieldValue.delete(), walletNonceExpiresAt: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  res.status(200).json({ address });
});
