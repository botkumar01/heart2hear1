import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { invalidArgument } from "../_lib/errors.js";
import { TRAINING_LESSONS } from "../_lib/trainingContent.js";

const requestSchema = z.object({
  lessonId: z.string(),
  answers: z.array(z.number().int().min(0)),
});

export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const lesson = TRAINING_LESSONS.find((l) => l.id === parsed.data.lessonId);
  if (!lesson) {
    throw invalidArgument("Unknown lesson.");
  }
  if (parsed.data.answers.length !== lesson.quiz.length) {
    throw invalidArgument("Answer count doesn't match this lesson's quiz.");
  }

  let correct = 0;
  const results = lesson.quiz.map((q, i) => {
    const isCorrect = parsed.data.answers[i] === q.correctIndex;
    if (isCorrect) correct += 1;
    return { id: q.id, correct: isCorrect, correctIndex: q.correctIndex, explanation: q.explanation };
  });

  const score = Math.round((correct / lesson.quiz.length) * 100);

  const progressRef = db().collection("helperTraining").doc(decoded.uid);
  await progressRef.set(
    {
      uid: decoded.uid,
      completedLessons: FieldValue.arrayUnion(lesson.id),
      [`quizScores.${lesson.id}`]: score,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  res.status(200).json({ score, results });
});
