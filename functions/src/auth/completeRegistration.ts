import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { auth, db } from "../lib/firebaseAdmin";

// One schema per self-service role. "admin" is intentionally absent — it is
// never assignable through this callable, only via manual provisioning.
const baseSchema = z.object({
  displayName: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  languagePreference: z.enum(["en", "ta", "hi"]).default("en"),
});

const clientSchema = baseSchema.extend({
  role: z.literal("client"),
  ageGroup: z.enum(["under_18", "18_24", "25_34", "35_44", "45_plus"]).optional(),
});

const helperSchema = baseSchema.extend({
  role: z.literal("helper"),
  helperPath: z.enum(["student", "volunteer"]),
});

const professionalSchema = baseSchema.extend({
  role: z.literal("professional"),
});

const requestSchema = z.discriminatedUnion("role", [clientSchema, helperSchema, professionalSchema]);

/**
 * Called once, immediately after Firebase client-side signup, while the
 * user is authenticated but has no role claim yet. Sets the role as a
 * custom claim (never trusted from the client afterwards) and creates the
 * Firestore profile document. Refuses to run a second time for the same
 * account, so a client cannot re-invoke it to change its own role.
 */
export const completeRegistration = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in before completing registration.");
  }

  const uid = request.auth.uid;
  const existingUser = await auth.getUser(uid);

  if (existingUser.customClaims?.role) {
    throw new HttpsError("failed-precondition", "This account already has a role assigned.");
  }

  const parsed = requestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const data = parsed.data;

  await auth.setCustomUserClaims(uid, { role: data.role });

  const profile: Record<string, unknown> = {
    uid,
    role: data.role,
    displayName: data.displayName,
    languagePreference: data.languagePreference,
    email: existingUser.email ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (data.role === "client") {
    profile.ageGroup = data.ageGroup ?? null;
  }

  if (data.role === "helper") {
    profile.helperPath = data.helperPath;
    profile.verificationStatus = "PENDING";
    profile.trainingCompleted = false;
    profile.testPassed = false;
    profile.availability = false;
  }

  if (data.role === "professional") {
    profile.verificationStatus = "PENDING";
  }

  await db.collection("users").doc(uid).set(profile, { merge: true });

  // The client must force-refresh its ID token after this call so the new
  // role claim takes effect (Firebase caches tokens for up to an hour).
  return { role: data.role };
});
