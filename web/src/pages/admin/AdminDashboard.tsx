import { AppShell } from "../../components/layout/AppShell";
import { ComingSoon } from "../../components/ComingSoon";

export function AdminDashboard() {
  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">Admin</h1>
      <p className="mt-1 text-ink-muted">Platform oversight and moderation.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <ComingSoon
          title="Helper & professional verification"
          description="Review submitted documents and approve or reject applications."
          phase="Phase 3 / 4"
        />
        <ComingSoon
          title="Safety incidents"
          description="Review flagged crisis events and moderation escalations."
          phase="Phase 2 / 3"
        />
        <ComingSoon
          title="Reports"
          description="Investigate reports filed by clients and helpers."
          phase="Phase 3"
        />
        <ComingSoon
          title="Platform settings"
          description="Configure training pass score, reward formula, and crisis resources."
          phase="Phase 3 / 5"
        />
        <ComingSoon
          title="Audit log"
          description="Every sensitive admin action, with actor, target, and timestamp."
          phase="Phase 6"
        />
      </div>
    </AppShell>
  );
}
