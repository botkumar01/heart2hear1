import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Trusted-backend credential for a Vercel-hosted server talking to a
// Firebase project on the free Spark plan. This is the Admin SDK
// equivalent of what Cloud Functions gets for free automatically — it
// costs nothing extra and needs no Blaze upgrade; only Firebase's own
// hosted Functions/Storage products require that.
//
// Stored as base64 (not raw JSON) specifically because a raw multi-line
// JSON value pasted into an env var UI is fragile — quoting/escaping
// differences between tools can silently corrupt it. Base64 has no
// special characters, so there's nothing for any of those tools to get
// wrong. See docs/VERCEL_SETUP.md.
function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. See docs/VERCEL_SETUP.md for how to generate " +
        "and configure it.",
    );
  }
  try {
    const json = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY could not be read. It should be the base64-encoded service " +
        "account JSON — see docs/VERCEL_SETUP.md.",
    );
  }
}

// Lazy singleton: importing this module must never throw. A bad/missing
// key should surface as our normal JSON error response from within
// withAuth's try/catch, not as a raw platform crash on every cold start.
let app: App | undefined;
function getApp(): App {
  if (!app) {
    app = getApps()[0] ?? initializeApp({ credential: cert(loadServiceAccount()) });
  }
  return app;
}

export const db = () => getFirestore(getApp());
export const auth = () => getAuth(getApp());
