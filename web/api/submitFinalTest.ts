import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { failedPrecondition, invalidArgument } from "./_lib/errors.js";
import { FINAL_TEST, TRAINING_LESSONS } from "./_lib/trainingContent.js";
import { issueCertificate } from "./_lib/certificates.js";

const requestSchema = z.object({
  answers: z.array(z.number().int().min(0)).length(FINAL_TEST.length),
});

const RETRY_COOLDOWN_HOURS = 24;
const DEFAULT_PASS_SCORE = 80;

export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const progressRef = db().collection("helperTraining").doc(decoded.uid);
  const progressSnap = await progressRef.get();
  const progress = progressSnap.data();

  if (!progress || (progress.completedLessons?.length ?? 0) < TRAINING_LESSONS.length) {
    throw failedPrecondition("Complete all training lessons before taking the final test.");
  }

  const attemptsRef = db().collection("trainingAttempts").doc(decoded.uid).collection("attempts");
  const lastAttemptSnap = await attemptsRef.orderBy("createdAt", "desc").limit(1).get();

  if (!lastAttemptSnap.empty) {
    const last = lastAttemptSnap.docs[0].data();
    const lastCreatedAt = last.createdAt as Timestamp | undefined;
    if (!last.passed && lastCreatedAt) {
      const hoursSince = (Date.now() - lastCreatedAt.toMillis()) / (1000 * 60 * 60);
      if (hoursSince < RETRY_COOLDOWN_HOURS) {
        const hoursLeft = Math.ceil(RETRY_COOLDOWN_HOURS - hoursSince);
        throw failedPrecondition(
          `You can retry the test in about ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}. Use the time to review the lessons.`,
        );
      }
    }
  }

  const settingsSnap = await db().collection("platformSettings").doc("training").get();
  const passScore = (settingsSnap.data()?.passScore as number | undefined) ?? DEFAULT_PASS_SCORE;

  let correct = 0;
  const results = FINAL_TEST.map((q, i) => {
    const isCorrect = parsed.data.answers[i] === q.correctIndex;
    if (isCorrect) correct += 1;
    return { id: q.id, correct: isCorrect, correctIndex: q.correctIndex, explanation: q.explanation };
  });

  const score = Math.round((correct / FINAL_TEST.length) * 100);
  const passed = score >= passScore;

  await attemptsRef.add({
    uid: decoded.uid,
    score,
    passed,
    passScoreAtTime: passScore,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (passed) {
    await db()
      .collection("users")
      .doc(decoded.uid)
      .set(
        { trainingCompleted: true, testPassed: true, verificationStatus: "UNDER_REVIEW", updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    await issueCertificate(decoded.uid, 1, "Training Completed");
  }

  res.status(200).json({ score, passed, passScore, results });
});
