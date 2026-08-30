import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { assertRole } from "../_lib/roles.js";

export default withAuth(async (_req, res, decoded) => {
  assertRole(decoded, "admin");

  const snap = await db().collection("safetyEvents").orderBy("createdAt", "desc").limit(100).get();

  const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.status(200).json({ items });
});
