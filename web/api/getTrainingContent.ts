import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { TRAINING_LESSONS, FINAL_TEST } from "./_lib/trainingContent.js";

function stripAnswers<T extends { correctIndex: number; explanation: string }>(q: T) {
  const { correctIndex: _c, explanation: _e, ...rest } = q;
  return rest;
}

/**
 * Serves the training curriculum with answer keys stripped — a client
 * only learns the correct answer (and why) for a question after
 * submitting and being graded server-side.
 */
export default withAuth(async (_req, res, decoded) => {
  const progressSnap = await db().collection("helperTraining").doc(decoded.uid).get();
  const progress = progressSnap.exists
    ? progressSnap.data()
    : { completedLessons: [], quizScores: {}, trainingCompleted: false, testPassed: false };

  const lessons = TRAINING_LESSONS.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    explanation: lesson.explanation,
    examples: lesson.examples,
    scenario: {
      prompt: lesson.scenario.prompt,
      question: lesson.scenario.question,
      options: lesson.scenario.options,
    },
    quiz: lesson.quiz.map(stripAnswers),
  }));

  const finalTest = FINAL_TEST.map(stripAnswers);

  res.status(200).json({ lessons, finalTest, progress });
});
