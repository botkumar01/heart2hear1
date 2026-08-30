import { AppShell } from "../../components/layout/AppShell";
import { ComingSoon } from "../../components/ComingSoon";
import { EmergencyNotice } from "../../components/BoundaryNotice";
import { useUserProfile } from "../../hooks/useUserProfile";
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
          <ComingSoon
            title="Quick Wellbeing Check"
            description="A short, friendly check-in that helps route you to the right kind of support."
            phase="Phase 2"
          />
          <ComingSoon
            title="Talk with Heart2Hear AI"
            description="A supportive, multilingual AI conversation — not a doctor or therapist."
            phase="Phase 2"
          />
          <ComingSoon
            title="Find a Helper"
            description="Get matched with a trained active listener based on language and availability."
            phase="Phase 3"
          />
          <ComingSoon
            title="Find a Professional"
            description="Browse verified psychiatrists and book a consultation."
            phase="Phase 4"
          />
          <ComingSoon
            title="Upcoming appointments"
            description="Your confirmed professional consultations will appear here."
            phase="Phase 4"
          />
          <ComingSoon
            title="Recent sessions"
            description="A history of your helper and professional sessions."
            phase="Phase 3"
          />
        </div>
      )}
    </AppShell>
  );
}
