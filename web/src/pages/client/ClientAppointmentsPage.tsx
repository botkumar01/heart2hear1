import { Link } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Spinner, EmptyState } from "../../components/ui/States";
import { ReviewModal } from "../../components/ReviewModal";
import { useMyAppointments } from "../../hooks/useMyAppointments";

const STATUS_TONE: Record<string, "teal" | "blue" | "yellow" | "danger" | "neutral"> = {
  PENDING_PAYMENT: "yellow",
  CONFIRMED: "teal",
  COMPLETED: "blue",
  CANCELLED: "neutral",
  NO_SHOW: "danger",
  REFUND_PENDING: "yellow",
  REFUNDED: "neutral",
};

export function ClientAppointmentsPage() {
  const { appointments, loading } = useMyAppointments("client");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">Appointments</h1>

      {loading ? (
        <Spinner />
      ) : appointments.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No appointments yet" description="Browse verified professionals to book one." />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                <CardTitle>{a.startTime.toDate().toLocaleString()}</CardTitle>
                <CardDescription className="mt-1">
                  ₹{a.feeInr} · {a.durationMinutes} min
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>{a.status.replace("_", " ")}</Badge>
                {a.status === "CONFIRMED" && (
                  <Link to={`/appointments/${a.id}/call`}>
                    <Button size="sm">Join call</Button>
                  </Link>
                )}
                {a.status === "COMPLETED" && !a.reviewed && (
                  <Button size="sm" onClick={() => setReviewingId(a.id)}>
                    Leave a review
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {reviewingId && (
        <ReviewModal
          open={Boolean(reviewingId)}
          onClose={() => setReviewingId(null)}
          sessionId={reviewingId}
          kind="professional"
          onSubmitted={() => setReviewingId(null)}
        />
      )}
    </AppShell>
  );
}
