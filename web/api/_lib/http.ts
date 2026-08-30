import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { DecodedIdToken } from "firebase-admin/auth";
import { auth } from "./firebaseAdmin.js";
import { ApiError, unauthenticated } from "./errors.js";

type AuthedHandler = (
  req: VercelRequest,
  res: VercelResponse,
  user: DecodedIdToken,
) => Promise<void>;

/**
 * Equivalent of a Firebase `onCall` function's auth handling, adapted for
 * a plain Vercel serverless function: requires POST, verifies the
 * Firebase ID token from `Authorization: Bearer <token>`, and turns any
 * thrown ApiError into a clean JSON error response instead of a raw
 * stack trace.
 */
export function withAuth(handler: AuthedHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      if (req.method !== "POST") {
        throw new ApiError(405, "Method not allowed.");
      }

      const header = req.headers.authorization ?? "";
      const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
      if (!token) {
        throw unauthenticated();
      }

      // If auth() itself throws synchronously (e.g. bad FIREBASE_SERVICE_ACCOUNT_KEY),
      // that skips this .catch() entirely and falls through to the generic 500
      // below — which is correct: a misconfiguration shouldn't be reported to the
      // user as "please sign in again".
      const user = await auth()
        .verifyIdToken(token)
        .catch((err) => {
          console.error("verifyIdToken failed", err);
          throw unauthenticated("Your session has expired. Please sign in again.");
        });

      await handler(req, res, user);
    } catch (err) {
      if (err instanceof ApiError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.error("Unhandled API error", err);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  };
}
