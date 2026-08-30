import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { invalidArgument, failedPrecondition } from "../_lib/errors.js";

const requestSchema = z.object({
  fullLegalName: z.string().trim().min(2).max(160),
  professionalEmail: z.string().trim().email(),
  phone: z.string().trim().min(6).max(20),
  professionalCategory: z.enum(["psychiatrist", "clinical_psychologist", "counselor", "other"]),
  qualification: z.string().trim().min(2).max(160),
  university: z.string().trim().min(2).max(160),
  registrationNumber: z.string().trim().min(2).max(80),
  registrationCouncil: z.enum(["NMC_STATE_MEDICAL_COUNCIL", "RCI", "OTHER"]),
  registrationState: z.string().trim().min(2).max(80),
  yearsOfExperience: z.number().int().min(0).max(70),
  specializations: z.array(z.string().trim().min(1)).min(1).max(10),
  consultationLanguages: z.array(z.string()).min(1).max(10),
  consultationFeeInr: z.number().int().min(0).max(1000000),
  agreedToDeclaration: z.literal(true),
});

/**
 * No reliable public verification API exists for NMC or RCI registration
 * (researched — only unofficial scrapers of their public lookup portals,
 * which this project won't rely on). This always routes to admin manual
 * review, who cross-checks the registration number against the
 * appropriate official public register (link surfaced in the admin
 * queue) — see docs/PROFESSIONAL_VERIFICATION.md.
 */
export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const data = parsed.data;

  const userSnap = await db().collection("users").doc(decoded.uid).get();
  if (!userSnap.exists || userSnap.data()?.role !== "professional") {
    throw failedPrecondition("This form is only for professional accounts.");
  }

  await db()
    .collection("users")
    .doc(decoded.uid)
    .set(
      {
        professionalVerification: {
          fullLegalName: data.fullLegalName,
          professionalEmail: data.professionalEmail,
          phone: data.phone,
          professionalCategory: data.professionalCategory,
          qualification: data.qualification,
          university: data.university,
          registrationNumber: data.registrationNumber,
          registrationCouncil: data.registrationCouncil,
          registrationState: data.registrationState,
          yearsOfExperience: data.yearsOfExperience,
          submittedAt: FieldValue.serverTimestamp(),
        },
        specializations: data.specializations,
        consultationLanguages: data.consultationLanguages,
        consultationFeeInr: data.consultationFeeInr,
        verificationStatus: "UNDER_REVIEW",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  res.status(200).json({ verificationStatus: "UNDER_REVIEW" });
});
