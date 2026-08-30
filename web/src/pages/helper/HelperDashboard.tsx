import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { BoundaryNotice } from "../../components/BoundaryNotice";
import { useUserProfile } from "../../hooks/useUserProfile";
import { Badge } from "../../components/ui/Badge";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/States";
import { callApi } from "../../lib/api";
import { useState } from "react";

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
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  async function toggleAvailability() {
    setTogglingAvailability(true);
    try {
      await callApi("toggleAvailability", { available: !profile?.availability });
    } finally {
      setTogglingAvailability(false);
    }
  }

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
          {status === "VERIFIED" && (
            <Card>
              <CardTitle>Availability</CardTitle>
              <CardDescription className="mt-1">
                {profile?.availability
                  ? "You're visible to clients looking for a helper."
                  : "You're currently hidden from the helper directory."}
              </CardDescription>
              <Button
                className="mt-4 w-full"
                variant={profile?.availability ? "secondary" : "primary"}
                onClick={toggleAvailability}
                isLoading={togglingAvailability}
              >
                {profile?.availability ? "Go offline" : "Go available"}
              </Button>
            </Card>
          )}

          {!profile?.trainingCompleted && profile?.helperPath === "volunteer" && (
            <Link to="/helper/training">
              <Card className="hover:shadow-[var(--shadow-soft-lg)]">
                <CardTitle>Helper training</CardTitle>
                <CardDescription className="mt-1">
                  Complete Heart2Hear's training modules and final assessment to get verified.
                </CardDescription>
              </Card>
            </Link>
          )}

          {profile?.helperPath === "student" && status === "PENDING" && (
            <Link to="/helper/student-verification">
              <Card className="hover:shadow-[var(--shadow-soft-lg)]">
                <CardTitle>Student verification</CardTitle>
                <CardDescription className="mt-1">
                  Submit your college details to start admin review.
                </CardDescription>
              </Card>
            </Link>
          )}

          <Link to="/helper/sessions">
            <Card className="hover:shadow-[var(--shadow-soft-lg)]">
              <CardTitle>Support requests & sessions</CardTitle>
              <CardDescription className="mt-1">
                Accept requests and chat privately with people matched to you.
              </CardDescription>
            </Card>
          </Link>

          <Card>
            <CardTitle>Ratings & certificates</CardTitle>
            <CardDescription className="mt-1">
              {profile?.averageRating
                ? `★ ${(profile.averageRating as number).toFixed(1)} average (${profile.ratingCount ?? 0} reviews) · ${profile.completedSessions ?? 0} sessions completed`
                : `${profile?.completedSessions ?? 0} sessions completed`}
            </CardDescription>
          </Card>

          <Link to="/helper/rewards">
            <Card className="hover:shadow-[var(--shadow-soft-lg)]">
              <CardTitle>Reward balance</CardTitle>
              <CardDescription className="mt-1">Connect a wallet and see your Sepolia testnet reward history.</CardDescription>
            </Card>
          </Link>
        </div>
      )}
    </AppShell>
  );
}
