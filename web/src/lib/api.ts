import { auth } from "./firebase";

export class ApiRequestError extends Error {}

/**
 * Calls one of our web/api/*.ts serverless functions, attaching the
 * current Firebase ID token as a Bearer header. Same-origin in both local
 * dev (`vercel dev`) and production (Vercel serves web/ and web/api/
 * together), so this is a plain fetch — no separate SDK, no CORS.
 */
export async function callApi<T = unknown>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new ApiRequestError("You need to be signed in.");
  }

  const idToken = await user.getIdToken();

  const res = await fetch(`/api/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiRequestError(typeof data.error === "string" ? data.error : "Something went wrong.");
  }

  return data as T;
}
