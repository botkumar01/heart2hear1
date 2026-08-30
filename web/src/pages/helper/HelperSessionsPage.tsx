import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Spinner, EmptyState } from "../../components/ui/States";
import { useMySessions } from "../../hooks/useMySessions";

const STATUS_TONE: Record<string, "teal" | "blue" | "yellow" | "danger" | "neutral"> = {
  REQUESTED: "yellow",
  ACTIVE: "teal",
  COMPLETED: "blue",
  REVIEWED: "blue",
  CANCELLED: "neutral",
  SAFETY_ESCALATED: "danger",
};

export function HelperSessionsPage() {
  const { sessions, loading } = useMySessions("helper");

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">Your Sessions</h1>
      <p className="mt-1 text-ink-muted">Incoming requests and past support sessions.</p>

      {loading ? (
        <Spinner />
      ) : sessions.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No sessions yet" description="Turn on availability from your dashboard to start receiving requests." />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {sessions.map((s) => (
            <Link key={s.id} to={`/session/${s.id}`}>
              <Card className="flex items-center justify-between hover:shadow-[var(--shadow-soft-lg)]">
                <div>
                  <CardTitle>Session {s.id.slice(0, 8)}</CardTitle>
                  <CardDescription className="mt-1">
                    {s.createdAt ? new Date(s.createdAt.toMillis()).toLocaleString() : ""}
                  </CardDescription>
                </div>
                <Badge tone={STATUS_TONE[s.status] ?? "neutral"}>{s.status.replace("_", " ")}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
