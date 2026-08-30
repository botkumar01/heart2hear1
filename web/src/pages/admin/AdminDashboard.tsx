import { AppShell } from "../../components/layout/AppShell";
import { VerificationQueue } from "../../components/admin/VerificationQueue";
import { SafetyIncidents } from "../../components/admin/SafetyIncidents";
import { Reports } from "../../components/admin/Reports";
import { PlatformSettings } from "../../components/admin/PlatformSettings";
import { AuditLog } from "../../components/admin/AuditLog";

export function AdminDashboard() {
  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">Admin</h1>
      <p className="mt-1 text-ink-muted">Platform oversight and moderation.</p>

      <div className="mt-6 space-y-6">
        <VerificationQueue />
        <SafetyIncidents />
        <Reports />
        <PlatformSettings />
        <AuditLog />
      </div>
    </AppShell>
  );
}
