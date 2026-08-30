import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Trusted-backend credential for a Vercel-hosted server talking to a
// Firebase project on the free Spark plan. This is the Admin SDK
// equivalent of what Cloud Functions gets for free automatically — it
// costs nothing extra and needs no Blaze upgrade; only Firebase's own
// hosted Functions/Storage products require that.
function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. See docs/VERCEL_SETUP.md for how to generate " +
        "and configure it.",
    );
  }
  return JSON.parse(raw);
}

if (getApps().length === 0) {
  initializeApp({ credential: cert(loadServiceAccount()) });
}

export const db = getFirestore();
export const auth = getAuth();
