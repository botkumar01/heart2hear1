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
} as const;

export function HelperDashboard() {
  const { profile, loading } = useUserProfile();
  const status = (profile?.verificationStatus as string | undefined) ?? "PENDING";

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {loading ? "Welcome" : `Welcome, ${profile?.displayName ?? "Helper"}`}
        </h1>
        {!loading && (
          <Badge tone={STATUS_TONE[status as keyof typeof STATUS_TONE] ?? "neutral"}>
            Verification: {status.replace("_", " ").toLowerCase()}
          </Badge>
        )}
      </div>

      <div className="mt-4">
        <BoundaryNotice role="helper" />
      </div>

      <p className="mt-4 rounded-lg bg-paper-dim px-4 py-3 text-sm font-medium text-ink">
        Remember: I am a trained listener, not a doctor.
      </p>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ComingSoon
            title="Helper training"
            description="Complete Heart2Hear's training modules and final assessment to get verified."
            phase="Phase 3"
          />
          <ComingSoon
            title="Availability"
            description="Toggle when you're available to receive support requests."
            phase="Phase 3"
          />
          <ComingSoon
            title="Support requests & sessions"
            description="Accept requests and chat privately with people matched to you."
            phase="Phase 3"
          />
          <ComingSoon
            title="Ratings & certificates"
            description="Track your session ratings and milestone certificates."
            phase="Phase 3"
          />
          <ComingSoon
            title="Reward balance"
            description="Connect a wallet and see your Sepolia testnet reward history."
            phase="Phase 5"
          />
        </div>
      )}
    </AppShell>
  );
}
