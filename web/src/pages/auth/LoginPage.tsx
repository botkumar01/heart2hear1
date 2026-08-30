import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { callApi } from "../../lib/api";
import { friendlyAuthError } from "../../lib/authErrors";
import { ROLE_HOME_PATH, type Role } from "../../lib/roles";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Label, FieldError } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Alert";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password);

      // Best-effort security email — never blocks login if it fails.
      callApi("sendLoginNotification", { deviceInfo: navigator.userAgent }).catch(() => undefined);

      const tokenResult = await credential.user.getIdTokenResult();
      const role = tokenResult.claims.role as Role | undefined;
      navigate(role ? ROLE_HOME_PATH[role] : "/register", { replace: true });
    } catch (err) {
      setFormError(friendlyAuthError(err));
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-12">
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">Log in to continue your Heart2Hear journey.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && <Alert tone="danger">{formError}</Alert>}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          New to Heart2Hear?{" "}
          <Link to="/register" className="font-medium text-teal-600 hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
