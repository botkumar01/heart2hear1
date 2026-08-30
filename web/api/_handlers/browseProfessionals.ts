import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";

export default withAuth(async (_req, res) => {
  const snap = await db()
    .collection("users")
    .where("role", "==", "professional")
    .where("verificationStatus", "==", "VERIFIED")
    .limit(50)
    .get();

  const professionals = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      displayName: data.displayName,
      qualification: data.professionalVerification?.qualification ?? null,
      professionalCategory: data.professionalVerification?.professionalCategory ?? null,
      yearsOfExperience: data.professionalVerification?.yearsOfExperience ?? null,
      specializations: data.specializations ?? [],
      consultationLanguages: data.consultationLanguages ?? [],
      consultationFeeInr: data.consultationFeeInr ?? null,
      averageRating: data.averageRating ?? null,
      ratingCount: data.ratingCount ?? 0,
      completedAppointments: data.completedAppointments ?? 0,
    };
  });

  res.status(200).json({ professionals });
});
