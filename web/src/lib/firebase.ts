import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);

// Fails loudly and early rather than letting every Firebase call throw a
// cryptic error later — see docs/FIREBASE_SETUP.md for where these values
// come from.
export const isFirebaseConfigured = missing.length === 0;

if (!isFirebaseConfigured) {
  console.error(
    `Firebase is not configured. Missing env vars: ${missing.join(", ")}.\n` +
      "Copy web/.env.example to web/.env and fill in your Firebase project's config " +
      "(see docs/FIREBASE_SETUP.md).",
  );
}

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(
  isFirebaseConfigured ? firebaseConfig : { apiKey: "demo", projectId: "demo" },
);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Local development against the Firestore/Auth emulators instead of the
// live project. Storage isn't included — it isn't enabled on the project
// yet (see docs/FIREBASE_SETUP.md), and the trusted backend (web/api/) is
// a Vercel-hosted Node server, not Firebase Cloud Functions, so there's no
// Functions emulator here either; use `vercel dev` for that locally.
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
