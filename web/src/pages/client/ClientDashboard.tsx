import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { EmergencyNotice } from "../../components/BoundaryNotice";
import { useUserProfile } from "../../hooks/useUserProfile";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/States";

export function ClientDashboard() {
  const { profile, loading } = useUserProfile();

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">
        {loading ? "Welcome" : `Hi ${profile?.displayName ?? "there"}, how are you feeling today?`}
      </h1>
      <p className="mt-1 text-ink-muted">You're not alone. Take a moment, and choose what feels right.</p>

      <div className="mt-6">
        <EmergencyNotice />
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link to="/client/wellbeing-check">
            <Card className="cursor-pointer hover:shadow-[var(--shadow-soft-lg)]">
              <CardTitle>Quick Wellbeing Check</CardTitle>
              <CardDescription className="mt-1">
                A short, friendly check-in that helps route you to the right kind of support.
              </CardDescription>
            </Card>
          </Link>
          <Link to="/client/ai">
            <Card className="cursor-pointer hover:shadow-[var(--shadow-soft-lg)]">
              <CardTitle>Talk with Heart2Hear AI</CardTitle>
              <CardDescription className="mt-1">
                A supportive, multilingual AI conversation — not a doctor or therapist.
              </CardDescription>
            </Card>
          </Link>
          <Link to="/client/helpers">
            <Card className="cursor-pointer hover:shadow-[var(--shadow-soft-lg)]">
              <CardTitle>Find a Helper</CardTitle>
              <CardDescription className="mt-1">
                Get matched with a trained active listener based on language and availability.
              </CardDescription>
            </Card>
          </Link>
          <Link to="/client/professionals">
            <Card className="cursor-pointer hover:shadow-[var(--shadow-soft-lg)]">
              <CardTitle>Find a Professional</CardTitle>
              <CardDescription className="mt-1">Browse verified psychiatrists and book a consultation.</CardDescription>
            </Card>
          </Link>
          <Link to="/client/appointments">
            <Card className="cursor-pointer hover:shadow-[var(--shadow-soft-lg)]">
              <CardTitle>Upcoming appointments</CardTitle>
              <CardDescription className="mt-1">Your confirmed professional consultations.</CardDescription>
            </Card>
          </Link>
          <Link to="/client/sessions">
            <Card className="cursor-pointer hover:shadow-[var(--shadow-soft-lg)]">
              <CardTitle>Recent sessions</CardTitle>
              <CardDescription className="mt-1">A history of your helper and professional sessions.</CardDescription>
            </Card>
          </Link>
        </div>
      )}
    </AppShell>
  );
}
