import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Input, Label, Select, FieldHint } from "../../components/ui/Field";
import { callApi, ApiRequestError } from "../../lib/api";

const LANGUAGE_OPTIONS = ["English", "Tamil", "Hindi"];

export function ProfessionalVerificationPage() {
  const [fullLegalName, setFullLegalName] = useState("");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [professionalCategory, setProfessionalCategory] = useState<
    "psychiatrist" | "clinical_psychologist" | "counselor" | "other"
  >("psychiatrist");
  const [qualification, setQualification] = useState("");
  const [university, setUniversity] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registrationCouncil, setRegistrationCouncil] = useState<"NMC_STATE_MEDICAL_COUNCIL" | "RCI" | "OTHER">(
    "NMC_STATE_MEDICAL_COUNCIL",
  );
  const [registrationState, setRegistrationState] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [consultationFeeInr, setConsultationFeeInr] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function toggleLanguage(lang: string) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  const canSubmit =
    fullLegalName &&
    professionalEmail &&
    phone &&
    qualification &&
    university &&
    registrationNumber &&
    registrationState &&
    yearsOfExperience &&
    specializations &&
    languages.length > 0 &&
    consultationFeeInr &&
    agreed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await callApi("submitProfessionalVerification", {
        fullLegalName,
        professionalEmail,
        phone,
        professionalCategory,
        qualification,
        university,
        registrationNumber,
        registrationCouncil,
        registrationState,
        yearsOfExperience: Number(yearsOfExperience),
        specializations: specializations.split(",").map((s) => s.trim()).filter(Boolean),
        consultationLanguages: languages,
        consultationFeeInr: Number(consultationFeeInr),
        agreedToDeclaration: true,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg">
          <Card>
            <CardTitle>Application submitted</CardTitle>
            <CardDescription className="mt-2">
              Your details are now with a Heart2Hear admin for manual review against the official
              registration register — there's no reliable public API for this, so a person checks
              it directly.
            </CardDescription>
            <Alert tone="info" className="mt-4">
              Document/KYC upload isn't available yet — it will be added once file storage is
              enabled. Your application is reviewed based on the details above until then.
            </Alert>
            <Alert tone="warning" className="mt-4">
              You can't accept paid consultations until your account shows "Verified".
            </Alert>
            <Link to="/professional" className="mt-4 inline-block">
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
        <h1 className="font-display text-2xl font-semibold text-ink">Professional Verification</h1>
        <p className="mt-1 text-ink-muted">
          A separate, more rigorous flow than helper verification — final approval always goes
          through admin review against the official register.
        </p>

        {error && (
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Card className="space-y-4">
            <div>
              <Label htmlFor="fullLegalName">Full legal name</Label>
              <Input id="fullLegalName" value={fullLegalName} onChange={(e) => setFullLegalName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="professionalEmail">Professional email</Label>
              <Input
                id="professionalEmail"
                type="email"
                value={professionalEmail}
                onChange={(e) => setProfessionalEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="category">Professional category</Label>
              <Select
                id="category"
                value={professionalCategory}
                onChange={(e) => setProfessionalCategory(e.target.value as typeof professionalCategory)}
              >
                <option value="psychiatrist">Psychiatrist (MBBS + MD Psychiatry)</option>
                <option value="clinical_psychologist">Clinical Psychologist</option>
                <option value="counselor">Counselor / Therapist</option>
                <option value="other">Other licensed mental-health professional</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                placeholder="e.g. MD Psychiatry"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="university">University / institution</Label>
              <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="registrationCouncil">Registration council</Label>
              <Select
                id="registrationCouncil"
                value={registrationCouncil}
                onChange={(e) => setRegistrationCouncil(e.target.value as typeof registrationCouncil)}
              >
                <option value="NMC_STATE_MEDICAL_COUNCIL">NMC / State Medical Council (doctors)</option>
                <option value="RCI">Rehabilitation Council of India (clinical psychologists)</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="registrationNumber">Registration number</Label>
              <Input
                id="registrationNumber"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
              <FieldHint>An admin will cross-check this against the official public register.</FieldHint>
            </div>
            <div>
              <Label htmlFor="registrationState">Registration state</Label>
              <Input id="registrationState" value={registrationState} onChange={(e) => setRegistrationState(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="yearsOfExperience">Years of experience</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                min={0}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="specializations">Specializations (comma-separated)</Label>
              <Input
                id="specializations"
                placeholder="e.g. Anxiety, Depression, Relationship counseling"
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
              />
            </div>
            <div>
              <Label>Consultation languages</Label>
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
            <div>
              <Label htmlFor="fee">Consultation fee (INR)</Label>
              <Input
                id="fee"
                type="number"
                min={0}
                value={consultationFeeInr}
                onChange={(e) => setConsultationFeeInr(e.target.value)}
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-ink-muted">
              <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              I declare the above information is accurate and I consent to Heart2Hear verifying it.
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
