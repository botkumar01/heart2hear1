import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { friendlyAuthError } from "../../lib/authErrors";
import { ROLE_HOME_PATH, ROLE_LABELS, SELF_SERVICE_ROLES, type SelfServiceRole } from "../../lib/roles";
import { Button } from "../../components/ui/Button";
import { Card, CardDescription, CardTitle } from "../../components/ui/Card";
import { Input, Label, Select, FieldError, FieldHint } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Alert";

const ROLE_BLURB: Record<SelfServiceRole, string> = {
  client: "I want support — talk with AI, a trained helper, or a verified professional.",
  helper: "I want to volunteer as a trained active listener for people who need support.",
  professional: "I'm a licensed psychiatrist / mental-health professional offering consultations.",
};

const baseSchema = {
  displayName: z.string().trim().min(2, "Please enter your name").max(80),
  languagePreference: z.enum(["en", "ta", "hi"]),
};

const newAccountSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    ...baseSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const existingAccountSchema = z.object(baseSchema);

const ageGroupSchema = z.enum(["under_18", "18_24", "25_34", "35_44", "45_plus"]);

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, refreshRole } = useAuth();
  const [role, setRole] = useState<SelfServiceRole | null>(null);
  const [helperPath, setHelperPath] = useState<"student" | "volunteer">("volunteer");
  const [ageGroup, setAgeGroup] = useState<z.infer<typeof ageGroupSchema> | "">("");
  const [formError, setFormError] = useState<string | null>(null);

  const alreadySignedIn = Boolean(user);
  const schema = alreadySignedIn ? existingAccountSchema : newAccountSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { languagePreference: "en" as const },
  });

  async function completeProfile(values: {
    displayName: string;
    languagePreference: "en" | "ta" | "hi";
  }) {
    if (!role) return;

    const payload: Record<string, unknown> = {
      role,
      displayName: values.displayName,
      languagePreference: values.languagePreference,
    };
    if (role === "helper") payload.helperPath = helperPath;
    if (role === "client" && ageGroup) payload.ageGroup = ageGroup;

    await httpsCallable(functions, "completeRegistration")(payload);
    await refreshRole();
  }

  async function onSubmit(values: Record<string, unknown>) {
    if (!role) return;
    setFormError(null);
    try {
      if (!alreadySignedIn) {
        const { email, password, displayName, languagePreference } = values as {
          email: string;
          password: string;
          displayName: string;
          languagePreference: "en" | "ta" | "hi";
        };
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(credential.user).catch(() => undefined);
        await completeProfile({ displayName, languagePreference });
      } else {
        await completeProfile(
          values as { displayName: string; languagePreference: "en" | "ta" | "hi" },
        );
      }
      navigate(ROLE_HOME_PATH[role], { replace: true });
    } catch (err) {
      setFormError(friendlyAuthError(err));
    }
  }

  if (!role) {
    return (
      <div className="min-h-dvh bg-paper px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-semibold text-ink">
            How would you like to join Heart2Hear?
          </h1>
          <p className="mt-2 text-ink-muted">Choose the account type that fits you. You can't switch later.</p>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-1">
            {SELF_SERVICE_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="w-full cursor-pointer text-left transition-shadow hover:shadow-[var(--shadow-soft-lg)]"
              >
                <Card>
                  <CardTitle>{ROLE_LABELS[r]}</CardTitle>
                  <CardDescription className="mt-1">{ROLE_BLURB[r]}</CardDescription>
                </Card>
              </button>
            ))}
          </div>

          <p className="mt-8 text-sm text-ink-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-teal-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-12">
      <Card className="w-full max-w-md">
        <button
          type="button"
          onClick={() => setRole(null)}
          className="mb-4 text-sm font-medium text-ink-muted hover:text-ink"
        >
          &larr; Choose a different account type
        </button>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Create your {ROLE_LABELS[role]} account
        </h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && <Alert tone="danger">{formError}</Alert>}

          {alreadySignedIn && (
            <Alert tone="info">Signed in as {user?.email}. Finish your profile to continue.</Alert>
          )}

          {!alreadySignedIn && (
            <>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email" as never)} />
                <FieldError>{(errors as Record<string, { message?: string }>).email?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password" as never)}
                />
                <FieldError>{(errors as Record<string, { message?: string }>).password?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword" as never)}
                />
                <FieldError>
                  {(errors as Record<string, { message?: string }>).confirmPassword?.message}
                </FieldError>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="displayName">Your name</Label>
            <Input id="displayName" autoComplete="name" {...register("displayName" as never)} />
            <FieldError>{(errors as Record<string, { message?: string }>).displayName?.message}</FieldError>
            <FieldHint>Shown to people you interact with — doesn't have to be your legal name.</FieldHint>
          </div>

          <div>
            <Label htmlFor="languagePreference">Preferred language</Label>
            <Select id="languagePreference" {...register("languagePreference" as never)}>
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </Select>
          </div>

          {role === "client" && (
            <div>
              <Label htmlFor="ageGroup">Age group (optional)</Label>
              <Select
                id="ageGroup"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as typeof ageGroup)}
              >
                <option value="">Prefer not to say</option>
                <option value="under_18">Under 18</option>
                <option value="18_24">18–24</option>
                <option value="25_34">25–34</option>
                <option value="35_44">35–44</option>
                <option value="45_plus">45+</option>
              </Select>
            </div>
          )}

          {role === "helper" && (
            <div>
              <Label htmlFor="helperPath">I am a...</Label>
              <Select
                id="helperPath"
                value={helperPath}
                onChange={(e) => setHelperPath(e.target.value as typeof helperPath)}
              >
                <option value="volunteer">General volunteer</option>
                <option value="student">Psychology / psychiatry student</option>
              </Select>
              <FieldHint>
                {helperPath === "student"
                  ? "You'll verify your college email and complete admin review."
                  : "You'll complete Heart2Hear's helper training and pass an assessment before going live."}
              </FieldHint>
            </div>
          )}

          {role === "professional" && (
            <Alert tone="info">
              After this step you'll complete a separate professional verification form (qualifications,
              registration number, and documents) before you can accept paid consultations.
            </Alert>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create account
          </Button>
        </form>

        {!alreadySignedIn && (
          <button
            type="button"
            className="mt-4 text-center text-xs text-ink-faint hover:text-ink-muted"
            onClick={() => signOut(auth).catch(() => undefined)}
          >
            Not you? Start over
          </button>
        )}
      </Card>
    </div>
  );
}
