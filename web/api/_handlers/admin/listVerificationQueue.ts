import { db } from "../../_lib/firebaseAdmin.js";
import { withAuth } from "../../_lib/http.js";
import { assertRole } from "../../_lib/roles.js";

const OFFICIAL_REGISTER_URL: Record<string, string> = {
  NMC_STATE_MEDICAL_COUNCIL: "https://www.nmc.org.in/information-desk/indian-medical-register/",
  RCI: "https://rehabcouncil.nic.in/",
};

/**
 * File lives at web/api/admin/listVerificationQueue.ts -> route
 * /api/admin/listVerificationQueue (Vercel mirrors the directory
 * structure under api/ into the URL path).
 */
export default withAuth(async (_req, res, decoded) => {
  assertRole(decoded, "admin");

  const snap = await db()
    .collection("users")
    .where("verificationStatus", "==", "UNDER_REVIEW")
    .limit(100)
    .get();

  const items = snap.docs.map((doc) => {
    const data = doc.data();
    const council = data.professionalVerification?.registrationCouncil as string | undefined;
    return {
      uid: doc.id,
      role: data.role,
      displayName: data.displayName,
      email: data.email,
      helperPath: data.helperPath ?? null,
      studentVerification: data.studentVerification ?? null,
      trainingCompleted: data.trainingCompleted ?? null,
      testPassed: data.testPassed ?? null,
      professionalVerification: data.professionalVerification ?? null,
      officialRegisterUrl: council ? (OFFICIAL_REGISTER_URL[council] ?? null) : null,
    };
  });

  res.status(200).json({ items });
});
