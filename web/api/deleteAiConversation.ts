import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";

/** User-controlled data deletion (spec §27): clears their AI conversation entirely. */
export default withAuth(async (_req, res, decoded) => {
  const messagesRef = db().collection("aiConversations").doc(decoded.uid).collection("messages");

  // Firestore has no native "delete collection" — page through in batches.
  let deleted = 0;
  for (;;) {
    const snap = await messagesRef.limit(300).get();
    if (snap.empty) break;
    const batch = db().batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.size;
    if (snap.size < 300) break;
  }

  res.status(200).json({ deleted });
});
