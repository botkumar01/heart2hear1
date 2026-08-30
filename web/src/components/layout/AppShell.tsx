import { type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut, sendEmailVerification } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_HOME_PATH, ROLE_LABELS } from "../../lib/roles";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Alert } from "../ui/Alert";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [verificationSent, setVerificationSent] = useState(false);

  async function handleLogout() {
    await signOut(auth);
    navigate("/", { replace: true });
  }

  async function handleResendVerification() {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser).catch(() => undefined);
    setVerificationSent(true);
  }

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-ink/8 bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to={role ? ROLE_HOME_PATH[role] : "/"} className="font-display text-lg font-semibold text-ink">
            Heart2Hear
          </Link>
          <div className="flex items-center gap-3">
            {role && <Badge tone="teal">{ROLE_LABELS[role]}</Badge>}
            <span className="hidden text-sm text-ink-muted sm:inline">{user?.email}</span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {user && !user.emailVerified && (
          <Alert tone="warning" title="Please verify your email" className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                We sent a verification link to {user.email}. Some features stay locked until it's
                confirmed.
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResendVerification}
                disabled={verificationSent}
              >
                {verificationSent ? "Email sent" : "Resend email"}
              </Button>
            </div>
          </Alert>
        )}
        {children}
      </main>
    </div>
  );
}
