import { AppShell } from "../../components/layout/AppShell";
import { ComingSoon } from "../../components/ComingSoon";
import { BoundaryNotice } from "../../components/BoundaryNotice";
import { useUserProfile } from "../../hooks/useUserProfile";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/States";

const STATUS_TONE = {
  PENDING: "yellow",
  UNDER_REVIEW: "blue",
  VERIFIED: "teal",
  VERIFICATION_FAILED: "danger",
  SUSPENDED: "danger",
  EXPIRED: "danger",
} as const;

export function ProfessionalDashboard() {
  const { profile, loading } = useUserProfile();
  const status = (profile?.verificationStatus as string | undefined) ?? "PENDING";

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {loading ? "Welcome" : `Welcome, Dr. ${profile?.displayName ?? ""}`}
        </h1>
        {!loading && (
          <Badge tone={STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "neutral"}>
            Verification: {status.replace("_", " ").toLowerCase()}
          </Badge>
        )}
      </div>

      <div className="mt-4">
        <BoundaryNotice role="professional" />
      </div>

      {status !== "VERIFIED" && (
        <p className="mt-4 rounded-lg bg-paper-dim px-4 py-3 text-sm text-ink-muted">
          You can't accept paid consultations until your credentials are verified.
        </p>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ComingSoon
            title="Professional verification"
            description="Submit qualifications, registration number, and documents for admin review."
            phase="Phase 4"
          />
          <ComingSoon
            title="Availability & appointments"
            description="Set your consultation slots and manage bookings."
            phase="Phase 4"
          />
          <ComingSoon
            title="Video consultations"
            description="Join secure video sessions with confirmed clients."
            phase="Phase 4"
          />
          <ComingSoon
            title="Earnings"
            description="Track payments received through Razorpay."
            phase="Phase 4"
          />
        </div>
      )}
    </AppShell>
  );
}
