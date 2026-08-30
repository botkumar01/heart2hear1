import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardDescription, CardTitle } from "../components/ui/Card";

const PATHS = [
  {
    title: "Talk with AI",
    description:
      "A supportive, multilingual conversation whenever you need it. Not a doctor or therapist — just a first place to put your thoughts.",
    tone: "teal" as const,
  },
  {
    title: "Talk with a Helper",
    description:
      "Trained volunteers who listen without judgment. They offer empathy and encouragement, never diagnosis or medical advice.",
    tone: "coral" as const,
  },
  {
    title: "Talk with a Professional",
    description:
      "Verified psychiatrists and mental-health professionals for consultations within their licensed scope of practice.",
    tone: "blue" as const,
  },
];

const STEPS = [
  "Tell us how you're feeling",
  "Choose the kind of support you want",
  "Talk privately, at your own pace",
  "Move to professional support when you need to",
];

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <span className="font-display text-xl font-semibold text-ink">Heart2Hear</span>
        <nav className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-ink-muted hover:text-ink">
            Log in
          </Link>
          <Link to="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
          Sometimes you don&apos;t need an answer.
          <br />
          You just need someone to hear you.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-muted">
          Heart2Hear is a stepped mental-wellness support ecosystem — someone to listen, someone to
          guide, someone to help — for stress, loneliness, anxiety, or just needing to talk.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/register">
            <Button size="lg" variant="coral">
              Start now — it&apos;s free
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              I already have an account
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-5 sm:grid-cols-3">
          {PATHS.map((path) => (
            <Card key={path.title}>
              <CardTitle>{path.title}</CardTitle>
              <CardDescription className="mt-2">{path.description}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">How it works</h2>
        <ol className="mt-8 space-y-4">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">
                {i + 1}
              </span>
              <span className="mt-1 text-ink">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <Card>
          <CardTitle>Your safety comes first</CardTitle>
          <CardDescription className="mt-2">
            Every conversation is monitored for signs of crisis. If you or someone else may be in
            immediate danger, Heart2Hear will guide you toward emergency and crisis resources right
            away — it is a support platform, not a replacement for emergency services.
          </CardDescription>
        </Card>
      </section>

      <footer className="border-t border-ink/8 py-8 text-center text-sm text-ink-muted">
        <p>Heart2Hear &mdash; someone to listen, someone to guide, someone to help.</p>
      </footer>
    </div>
  );
}
