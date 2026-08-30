import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";

/**
 * Matching (spec §30): language + availability first, topic as a
 * client-side refinement over the small result set a demo/college-project
 * scale platform actually has — no need for a heavier ranking system yet.
 */
export default withAuth(async (_req, res) => {
  const snap = await db()
    .collection("users")
    .where("role", "==", "helper")
    .where("verificationStatus", "==", "VERIFIED")
    .where("availability", "==", true)
    .limit(50)
    .get();

  const helpers = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      displayName: data.displayName,
      languagePreference: data.languagePreference,
      helperPath: data.helperPath,
      certificationLevel: data.certificationLevel ?? 0,
      completedSessions: data.completedSessions ?? 0,
      averageRating: data.averageRating ?? null,
      ratingCount: data.ratingCount ?? 0,
      bio: data.helperBio ?? null,
    };
  });

  res.status(200).json({ helpers });
});
