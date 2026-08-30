import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { SafetyPanel } from "../../components/SafetyPanel";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Label } from "../../components/ui/Field";
import { callApi, ApiRequestError } from "../../lib/api";
import { cn } from "../../lib/cn";

// Mirrors the union in web/api/submitWellbeingAssessment.ts — kept as a
// plain type (no runtime import) so the client build never depends on
// the server project's tsconfig/include boundary.
type RoutingSignal =
  | "LOW_SUPPORT_NEED"
  | "MODERATE_SUPPORT_NEED"
  | "PROFESSIONAL_SUPPORT_RECOMMENDED"
  | "SAFETY_ESCALATION";

const MOODS = [
  { value: "good", label: "Good" },
  { value: "okay", label: "Okay" },
  { value: "struggling", label: "Struggling" },
  { value: "very_low", label: "Very low" },
] as const;

const PRESSURE_SOURCES = [
  { value: "academic", label: "Academic" },
  { value: "work", label: "Work" },
  { value: "relationship", label: "Relationship" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
] as const;

const WANTS_TO_TALK = [
  { value: "listen", label: "Someone to listen" },
  { value: "professional", label: "Professional guidance" },
  { value: "ai", label: "Explore my feelings with AI" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

function ScaleButtons({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[0, 1, 2, 3, 4].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors",
            value === n
              ? "border-teal-500 bg-teal-500 text-white"
              : "border-ink/15 bg-surface text-ink-muted hover:border-teal-500/50",
          )}
          aria-pressed={value === n}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

const ROUTING_COPY: Record<RoutingSignal, { title: string; body: string }> = {
  LOW_SUPPORT_NEED: {
    title: "Things sound relatively steady right now",
    body: "That's good to hear. If you'd still like to talk something through, AI support or a trained helper are here whenever you want.",
  },
  MODERATE_SUPPORT_NEED: {
    title: "It sounds like you could use some support",
    body: "Talking to someone — an AI companion or a trained helper — could genuinely help right now.",
  },
  PROFESSIONAL_SUPPORT_RECOMMENDED: {
    title: "Professional support may really help here",
    body: "Your answers suggest that you may be experiencing significant emotional stress. Talking with a qualified professional may be helpful.",
  },
  SAFETY_ESCALATION: {
    title: "Let's get you immediate support",
    body: "Based on what you shared, please see the safety resources below — you deserve real, immediate help.",
  },
};

export function WellbeingCheckPage() {
  const [step, setStep] = useState<"form" | "result">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routing, setRouting] = useState<RoutingSignal | null>(null);

  const [currentMood, setCurrentMood] = useState<(typeof MOODS)[number]["value"] | "">("");
  const [stressLevel, setStressLevel] = useState(0);
  const [lonelinessLevel, setLonelinessLevel] = useState(0);
  const [anxietyLevel, setAnxietyLevel] = useState(0);
  const [sleepDifficulty, setSleepDifficulty] = useState<boolean | null>(null);
  const [pressureSources, setPressureSources] = useState<string[]>([]);
  const [wantsToTalk, setWantsToTalk] = useState<(typeof WANTS_TO_TALK)[number]["value"] | "">("");
  const [feelsSafeRightNow, setFeelsSafeRightNow] = useState<boolean | null>(null);
  const [shareMore, setShareMore] = useState("");

  const canSubmit = currentMood && sleepDifficulty !== null && wantsToTalk && feelsSafeRightNow !== null;

  function togglePressure(value: string) {
    setPressureSources((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await callApi<{ routingSignal: RoutingSignal }>("submitWellbeingAssessment", {
        currentMood,
        stressLevel,
        lonelinessLevel,
        anxietyLevel,
        sleepDifficulty,
        pressureSources,
        wantsToTalk,
        feelsSafeRightNow,
        shareMore: shareMore.trim() || undefined,
      });
      setRouting(result.routingSignal);
      setStep("result");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "result" && routing) {
    const copy = ROUTING_COPY[routing];
    return (
      <AppShell>
        <div className="mx-auto max-w-xl">
          <h1 className="font-display text-2xl font-semibold text-ink">{copy.title}</h1>
          <p className="mt-2 text-ink-muted">{copy.body}</p>

          {routing === "SAFETY_ESCALATION" && (
            <div className="mt-6">
              <SafetyPanel />
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to="/client/ai">
              <Card className="cursor-pointer hover:shadow-[var(--shadow-soft-lg)]">
                <CardTitle>Talk with Heart2Hear AI</CardTitle>
                <CardDescription className="mt-1">
                  A supportive conversation, available right now.
                </CardDescription>
              </Card>
            </Link>
            <Card className="opacity-70">
              <CardTitle>Find a Helper</CardTitle>
              <CardDescription className="mt-1">Coming in Phase 3.</CardDescription>
            </Card>
          </div>

          <Link to="/client" className="mt-6 inline-block text-sm text-ink-muted underline hover:text-ink">
            Back to dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-2xl font-semibold text-ink">Quick Wellbeing Check</h1>
        <p className="mt-1 text-ink-muted">
          This isn't a diagnosis — just a few questions to help us point you toward the right kind of
          support.
        </p>

        {error && (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <Card className="mt-6 space-y-6">
          <div>
            <Label>How are you feeling right now?</Label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setCurrentMood(m.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    currentMood === m.value
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-ink/15 bg-surface text-ink-muted hover:border-teal-500/50",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Stress level (0 = none, 4 = overwhelming)</Label>
            <ScaleButtons value={stressLevel} onChange={setStressLevel} />
          </div>

          <div>
            <Label>Loneliness (0 = not at all, 4 = very lonely)</Label>
            <ScaleButtons value={lonelinessLevel} onChange={setLonelinessLevel} />
          </div>

          <div>
            <Label>Anxiety-like feelings (0 = none, 4 = intense)</Label>
            <ScaleButtons value={anxietyLevel} onChange={setAnxietyLevel} />
          </div>

          <div>
            <Label>Having trouble sleeping lately?</Label>
            <div className="flex gap-2">
              {[
                { v: true, label: "Yes" },
                { v: false, label: "No" },
              ].map((opt) => (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => setSleepDifficulty(opt.v)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",
                    sleepDifficulty === opt.v
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-ink/15 bg-surface text-ink-muted hover:border-teal-500/50",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>What's weighing on you? (optional, pick any)</Label>
            <div className="flex flex-wrap gap-2">
              {PRESSURE_SOURCES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePressure(p.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",
                    pressureSources.includes(p.value)
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-ink/15 bg-surface text-ink-muted hover:border-teal-500/50",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>What would help most right now?</Label>
            <div className="flex flex-wrap gap-2">
              {WANTS_TO_TALK.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setWantsToTalk(w.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",
                    wantsToTalk === w.value
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-ink/15 bg-surface text-ink-muted hover:border-teal-500/50",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Do you feel safe right now?</Label>
            <div className="flex gap-2">
              {[
                { v: true, label: "Yes, I feel safe" },
                { v: false, label: "No, I don't" },
              ].map((opt) => (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => setFeelsSafeRightNow(opt.v)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",
                    feelsSafeRightNow === opt.v
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-ink/15 bg-surface text-ink-muted hover:border-teal-500/50",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="shareMore">Anything you'd like to share? (optional)</Label>
            <textarea
              id="shareMore"
              className="w-full rounded-md border border-ink/15 bg-surface px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              rows={3}
              maxLength={1000}
              value={shareMore}
              onChange={(e) => setShareMore(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={!canSubmit} isLoading={submitting} onClick={handleSubmit}>
            See my results
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
