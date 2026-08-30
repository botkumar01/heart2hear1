import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Spinner } from "../../components/ui/States";
import { Badge } from "../../components/ui/Badge";
import { callApi, ApiRequestError } from "../../lib/api";
import { cn } from "../../lib/cn";

interface QuizQuestionView {
  id: string;
  question: string;
  options: string[];
}
interface LessonView {
  id: string;
  title: string;
  explanation: string[];
  examples: string[];
  scenario: { prompt: string; question: string; options: string[] };
  quiz: QuizQuestionView[];
}
interface Progress {
  completedLessons?: string[];
  quizScores?: Record<string, number>;
  trainingCompleted?: boolean;
  testPassed?: boolean;
}
interface QuizResult {
  id: string;
  correct: boolean;
  correctIndex: number;
  explanation: string;
}

type View = "list" | "lesson" | "final-test" | "final-result";

export function TrainingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonView[]>([]);
  const [finalTest, setFinalTest] = useState<QuizQuestionView[]>([]);
  const [progress, setProgress] = useState<Progress>({});
  const [view, setView] = useState<View>("list");
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lessonResults, setLessonResults] = useState<QuizResult[] | null>(null);
  const [finalResult, setFinalResult] = useState<{ score: number; passed: boolean; passScore: number; results: QuizResult[] } | null>(null);

  async function loadContent() {
    setLoading(true);
    setError(null);
    try {
      const data = await callApi<{ lessons: LessonView[]; finalTest: QuizQuestionView[]; progress: Progress }>(
        "getTrainingContent",
      );
      setLessons(data.lessons);
      setFinalTest(data.finalTest);
      setProgress(data.progress);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't load training content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
  }, []);

  function openLesson(lessonId: string) {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    setActiveLessonId(lessonId);
    setAnswers(new Array(lesson.quiz.length).fill(-1));
    setLessonResults(null);
    setView("lesson");
  }

  async function submitLessonQuiz() {
    if (!activeLessonId) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await callApi<{ score: number; results: QuizResult[] }>("submitLessonQuiz", {
        lessonId: activeLessonId,
        answers,
      });
      setLessonResults(data.results);
      await loadContent();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  function startFinalTest() {
    setAnswers(new Array(finalTest.length).fill(-1));
    setFinalResult(null);
    setView("final-test");
  }

  async function submitFinal() {
    setSubmitting(true);
    setError(null);
    try {
      const data = await callApi<{ score: number; passed: boolean; passScore: number; results: QuizResult[] }>(
        "submitFinalTest",
        { answers },
      );
      setFinalResult(data);
      setView("final-result");
      await loadContent();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't submit the final test.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <Spinner label="Loading training…" />
      </AppShell>
    );
  }

  const completedCount = progress.completedLessons?.length ?? 0;
  const allLessonsDone = completedCount >= lessons.length && lessons.length > 0;

  if (view === "lesson" && activeLessonId) {
    const lesson = lessons.find((l) => l.id === activeLessonId)!;
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <button onClick={() => setView("list")} className="mb-4 text-sm text-ink-muted hover:text-ink">
            &larr; Back to lessons
          </button>
          <h1 className="font-display text-2xl font-semibold text-ink">{lesson.title}</h1>

          <Card className="mt-4 space-y-3">
            {lesson.explanation.map((p, i) => (
              <p key={i} className="text-sm text-ink">
                {p}
              </p>
            ))}
          </Card>

          <Card className="mt-4">
            <CardTitle>Examples</CardTitle>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-ink-muted">
              {lesson.examples.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </Card>

          <Card className="mt-4">
            <CardTitle>Scenario</CardTitle>
            <CardDescription className="mt-2">{lesson.scenario.prompt}</CardDescription>
            <p className="mt-3 text-sm font-medium text-ink">{lesson.scenario.question}</p>
          </Card>

          <Card className="mt-4 space-y-6">
            <CardTitle>Check your understanding</CardTitle>
            {lesson.quiz.map((q, qi) => (
              <div key={q.id}>
                <p className="text-sm font-medium text-ink">{q.question}</p>
                <div className="mt-2 space-y-2">
                  {q.options.map((opt, oi) => {
                    const result = lessonResults?.find((r) => r.id === q.id);
                    const isSelected = answers[qi] === oi;
                    const showFeedback = Boolean(result);
                    const isCorrectOption = result && oi === result.correctIndex;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={showFeedback}
                        onClick={() =>
                          setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                        }
                        className={cn(
                          "block w-full rounded-md border px-3 py-2 text-left text-sm",
                          isSelected && !showFeedback && "border-teal-500 bg-teal-50",
                          !isSelected && !showFeedback && "border-ink/15 hover:border-teal-500/50",
                          showFeedback && isCorrectOption && "border-teal-500 bg-teal-100",
                          showFeedback && isSelected && !isCorrectOption && "border-danger-500 bg-danger-100",
                          showFeedback && !isSelected && !isCorrectOption && "border-ink/10 opacity-60",
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {lessonResults?.find((r) => r.id === q.id) && (
                  <p className="mt-2 text-xs text-ink-muted">
                    {lessonResults.find((r) => r.id === q.id)!.explanation}
                  </p>
                )}
              </div>
            ))}

            {error && <Alert tone="danger">{error}</Alert>}

            {!lessonResults ? (
              <Button
                onClick={submitLessonQuiz}
                isLoading={submitting}
                disabled={answers.some((a) => a === -1)}
              >
                Submit answers
              </Button>
            ) : (
              <Button onClick={() => setView("list")}>Continue</Button>
            )}
          </Card>
        </div>
      </AppShell>
    );
  }

  if (view === "final-test") {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-2xl font-semibold text-ink">Final Assessment</h1>
          <p className="mt-1 text-ink-muted">Scenario-based questions covering everything from the lessons.</p>

          {error && (
            <div className="mt-4">
              <Alert tone="danger">{error}</Alert>
            </div>
          )}

          <Card className="mt-4 space-y-6">
            {finalTest.map((q, qi) => (
              <div key={q.id}>
                <p className="text-sm font-medium text-ink">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-2 space-y-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                      className={cn(
                        "block w-full rounded-md border px-3 py-2 text-left text-sm",
                        answers[qi] === oi ? "border-teal-500 bg-teal-50" : "border-ink/15 hover:border-teal-500/50",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={submitFinal} isLoading={submitting} disabled={answers.some((a) => a === -1)}>
              Submit final test
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (view === "final-result" && finalResult) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardTitle>{finalResult.passed ? "You passed!" : "Not quite yet"}</CardTitle>
            <CardDescription className="mt-2">
              Score: {finalResult.score}% (pass mark: {finalResult.passScore}%)
            </CardDescription>
            {finalResult.passed ? (
              <Alert tone="success" className="mt-4">
                Training completed. Your application now moves to admin review before you can go
                live as a verified helper.
              </Alert>
            ) : (
              <Alert tone="warning" className="mt-4">
                Review the lessons and try again after the retry waiting period.
              </Alert>
            )}
            <div className="mt-4 space-y-3">
              {finalResult.results
                .filter((r) => !r.correct)
                .map((r) => (
                  <p key={r.id} className="text-sm text-ink-muted">
                    {r.explanation}
                  </p>
                ))}
            </div>
            <Link to="/helper" className="mt-4 inline-block">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-ink">Helper Training</h1>
        <p className="mt-1 text-ink-muted">
          Complete every lesson, then take the final assessment to become a verified helper.
        </p>

        {error && (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {lessons.map((lesson) => {
            const done = progress.completedLessons?.includes(lesson.id);
            return (
              <button key={lesson.id} onClick={() => openLesson(lesson.id)} className="block w-full text-left">
                <Card className="flex items-center justify-between hover:shadow-[var(--shadow-soft-lg)]">
                  <div>
                    <CardTitle>{lesson.title}</CardTitle>
                    {done && (
                      <CardDescription className="mt-1">
                        Score: {progress.quizScores?.[lesson.id] ?? 0}%
                      </CardDescription>
                    )}
                  </div>
                  <Badge tone={done ? "teal" : "neutral"}>{done ? "Completed" : "Start"}</Badge>
                </Card>
              </button>
            );
          })}
        </div>

        <Card className="mt-6">
          <CardTitle>Final Assessment</CardTitle>
          <CardDescription className="mt-2">
            {allLessonsDone
              ? "You've completed all lessons — you're ready for the final test."
              : `Complete all ${lessons.length} lessons to unlock the final test.`}
          </CardDescription>
          <Button className="mt-4" onClick={startFinalTest} disabled={!allLessonsDone}>
            {progress.testPassed ? "Retake final test" : "Take final test"}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
