import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { DecodedIdToken } from "firebase-admin/auth";
import { auth } from "./firebaseAdmin";
import { ApiError, unauthenticated } from "./errors";

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

      const user = await auth.verifyIdToken(token).catch(() => {
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
