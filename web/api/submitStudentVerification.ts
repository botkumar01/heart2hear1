import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { invalidArgument, failedPrecondition } from "./_lib/errors.js";

const EDU_DOMAIN_PATTERN = /\.(edu|ac\.[a-z]{2,3}|edu\.[a-z]{2,3})$/i;

const requestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  collegeName: z.string().trim().min(2).max(160),
  degreeProgram: z.string().trim().min(2).max(120),
  yearOfStudy: z.string().trim().min(1).max(40),
  collegeEmail: z.string().trim().email(),
  languages: z.array(z.string()).min(1).max(10),
  agreedToCodeOfConduct: z.literal(true),
});

/**
 * A college-email domain check is a *signal*, not proof (spec §14: "Do
 * not assume that having a college email automatically proves the person
 * is a legitimate psychology student"). The actual verification gate is
 * the admin review this always routes to — document upload will be added
 * once Firebase Storage is enabled (see docs/FIREBASE_SETUP.md).
 */
export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const data = parsed.data;

  const userSnap = await db().collection("users").doc(decoded.uid).get();
  const userData = userSnap.data();
  if (!userSnap.exists || userData?.role !== "helper" || userData?.helperPath !== "student") {
    throw failedPrecondition("This form is only for the student-helper registration path.");
  }

  const domain = data.collegeEmail.split("@")[1] ?? "";
  const domainLooksEducational = EDU_DOMAIN_PATTERN.test(domain);

  await db()
    .collection("users")
    .doc(decoded.uid)
    .set(
      {
        studentVerification: {
          fullName: data.fullName,
          collegeName: data.collegeName,
          degreeProgram: data.degreeProgram,
          yearOfStudy: data.yearOfStudy,
          collegeEmail: data.collegeEmail,
          collegeEmailDomainLooksEducational: domainLooksEducational,
          languages: data.languages,
          submittedAt: FieldValue.serverTimestamp(),
        },
        verificationStatus: "UNDER_REVIEW",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  res.status(200).json({ verificationStatus: "UNDER_REVIEW", domainLooksEducational });
});
