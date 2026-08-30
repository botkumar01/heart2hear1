import { Link } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Spinner, EmptyState } from "../../components/ui/States";
import { useMyAppointments } from "../../hooks/useMyAppointments";
import { callApi, ApiRequestError } from "../../lib/api";

const STATUS_TONE: Record<string, "teal" | "blue" | "yellow" | "danger" | "neutral"> = {
  PENDING_PAYMENT: "yellow",
  CONFIRMED: "teal",
  COMPLETED: "blue",
  CANCELLED: "neutral",
  NO_SHOW: "danger",
  REFUND_PENDING: "yellow",
  REFUNDED: "neutral",
};

export function ProfessionalAppointmentsPage() {
  const { appointments, loading } = useMyAppointments("professional");
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  async function markComplete(appointmentId: string, outcome: "completed" | "no_show") {
    setActingId(appointmentId);
    setError(null);
    try {
      await callApi("completeAppointment", { appointmentId, outcome });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't update this appointment.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">Appointments</h1>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : appointments.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No appointments yet" description="Add availability slots from your dashboard." />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                <CardTitle>{a.startTime.toDate().toLocaleString()}</CardTitle>
                <CardDescription className="mt-1">₹{a.feeInr} · {a.durationMinutes} min</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>{a.status.replace("_", " ")}</Badge>
                {a.status === "CONFIRMED" && (
                  <>
                    <Link to={`/appointments/${a.id}/call`}>
                      <Button size="sm">Join call</Button>
                    </Link>
                    <Button size="sm" variant="secondary" isLoading={actingId === a.id} onClick={() => markComplete(a.id, "completed")}>
                      Mark complete
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
