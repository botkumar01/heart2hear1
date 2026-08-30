import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { ComingSoon } from "../../components/ComingSoon";
import { BoundaryNotice } from "../../components/BoundaryNotice";
import { useUserProfile } from "../../hooks/useUserProfile";
import { Badge } from "../../components/ui/Badge";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Alert";
import { Spinner } from "../../components/ui/States";
import { callApi, ApiRequestError } from "../../lib/api";

const STATUS_TONE = {
  PENDING: "yellow",
  UNDER_REVIEW: "blue",
  VERIFIED: "teal",
  VERIFICATION_FAILED: "danger",
  SUSPENDED: "danger",
  EXPIRED: "danger",
} as const;

interface Slot {
  slotId: string;
  startTime: string;
  durationMinutes: number;
}

function AvailabilityManager({ uid }: { uid: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTime, setNewTime] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await callApi<{ slots: Slot[] }>("getProfessionalSlots", { professionalUid: uid });
      setSlots(data.slots);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't load slots.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addSlot() {
    if (!newTime) return;
    setAdding(true);
    setError(null);
    try {
      await callApi("addAvailabilitySlot", { startTime: new Date(newTime).toISOString(), durationMinutes: 30 });
      setNewTime("");
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't add slot.");
    } finally {
      setAdding(false);
    }
  }

  async function removeSlot(slotId: string) {
    try {
      await callApi("removeAvailabilitySlot", { slotId });
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't remove slot.");
    }
  }

  return (
    <Card>
      <CardTitle>Availability</CardTitle>
      <CardDescription className="mt-1">Add 30-minute consultation slots clients can book.</CardDescription>

      {error && (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Input type="datetime-local" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
        <Button onClick={addSlot} isLoading={adding} disabled={!newTime}>
          Add
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <Spinner />
        ) : slots.length === 0 ? (
          <p className="text-sm text-ink-muted">No upcoming open slots.</p>
        ) : (
          slots.map((s) => (
            <div key={s.slotId} className="flex items-center justify-between rounded-md bg-paper-dim px-3 py-2 text-sm">
              <span>{new Date(s.startTime).toLocaleString()}</span>
              <button onClick={() => removeSlot(s.slotId)} className="text-danger-500 hover:underline">
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

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
          {status === "PENDING" && (
            <Link to="/professional/verification">
              <Card className="hover:shadow-[var(--shadow-soft-lg)]">
                <CardTitle>Professional verification</CardTitle>
                <CardDescription className="mt-1">
                  Submit qualifications, registration number, and documents for admin review.
                </CardDescription>
              </Card>
            </Link>
          )}

          {status === "VERIFIED" && profile?.uid && <AvailabilityManager uid={profile.uid as string} />}

          <Link to="/professional/appointments">
            <Card className="hover:shadow-[var(--shadow-soft-lg)]">
              <CardTitle>Appointments</CardTitle>
              <CardDescription className="mt-1">Manage bookings and join video consultations.</CardDescription>
            </Card>
          </Link>

          <Card>
            <CardTitle>Earnings & ratings</CardTitle>
            <CardDescription className="mt-1">
              {profile?.averageRating
                ? `★ ${(profile.averageRating as number).toFixed(1)} average (${profile.ratingCount ?? 0} reviews)`
                : "No ratings yet"}{" "}
              · {profile?.completedAppointments ?? 0} consultations completed
            </CardDescription>
          </Card>

          <ComingSoon title="Payout tracking" description="Detailed earnings breakdown and payout history." phase="Phase 6" />
        </div>
      )}
    </AppShell>
  );
}
