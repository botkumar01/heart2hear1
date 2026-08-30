import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Input, Label, FieldHint } from "../../components/ui/Field";
import { callApi, ApiRequestError } from "../../lib/api";

const LANGUAGE_OPTIONS = ["English", "Tamil", "Hindi"];

export function StudentVerificationPage() {
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ domainLooksEducational: boolean } | null>(null);

  function toggleLanguage(lang: string) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  const canSubmit =
    fullName && collegeName && degreeProgram && yearOfStudy && collegeEmail && languages.length > 0 && agreed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await callApi<{ domainLooksEducational: boolean }>("submitStudentVerification", {
        fullName,
        collegeName,
        degreeProgram,
        yearOfStudy,
        collegeEmail,
        languages,
        agreedToCodeOfConduct: true,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg">
          <Card>
            <CardTitle>Application submitted</CardTitle>
            <CardDescription className="mt-2">
              Your details are now with a Heart2Hear admin for manual review.
            </CardDescription>
            {!result.domainLooksEducational && (
              <Alert tone="warning" className="mt-4">
                Your college email domain didn't automatically match a typical educational
                pattern — that's okay, admin review still covers this, it may just take a little
                longer.
              </Alert>
            )}
            <Alert tone="info" className="mt-4">
              Document upload (student ID) isn't available yet — it will be added once file
              storage is enabled. For now, your application is reviewed based on the details
              above.
            </Alert>
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
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-2xl font-semibold text-ink">Student Helper Verification</h1>
        <p className="mt-1 text-ink-muted">
          For psychology/psychiatry students. Your college email is one verification signal among
          several — final approval always goes through admin review.
        </p>

        {error && (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Card className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="collegeName">College / university</Label>
              <Input id="collegeName" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="degreeProgram">Degree / program</Label>
              <Input
                id="degreeProgram"
                placeholder="e.g. B.A. Psychology"
                value={degreeProgram}
                onChange={(e) => setDegreeProgram(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="yearOfStudy">Year / semester</Label>
              <Input id="yearOfStudy" value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="collegeEmail">College email</Label>
              <Input
                id="collegeEmail"
                type="email"
                value={collegeEmail}
                onChange={(e) => setCollegeEmail(e.target.value)}
              />
              <FieldHint>Your institution-issued email, not your personal one.</FieldHint>
            </div>
            <div>
              <Label>Languages you can support in</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={
                      languages.includes(lang)
                        ? "rounded-full border border-teal-500 bg-teal-500 px-4 py-2 text-sm font-medium text-white"
                        : "rounded-full border border-ink/15 bg-surface px-4 py-2 text-sm font-medium text-ink-muted hover:border-teal-500/50"
                    }
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              I agree to Heart2Hear's helper code of conduct — supportive listening only, never
              medical advice or diagnosis.
            </label>
          </Card>

          <Button type="submit" className="w-full" isLoading={submitting} disabled={!canSubmit}>
            Submit for review
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
