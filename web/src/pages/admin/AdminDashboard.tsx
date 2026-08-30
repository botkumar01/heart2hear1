import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { ComingSoon } from "../../components/ComingSoon";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { Spinner, EmptyState } from "../../components/ui/States";
import { callApi, ApiRequestError } from "../../lib/api";

interface QueueItem {
  uid: string;
  role: string;
  displayName: string;
  email: string;
  helperPath: string | null;
  studentVerification: { collegeName: string; collegeEmail: string; collegeEmailDomainLooksEducational: boolean } | null;
  trainingCompleted: boolean | null;
  testPassed: boolean | null;
  professionalVerification: unknown;
}

function VerificationQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingUid, setActingUid] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await callApi<{ items: QueueItem[] }>("admin/listVerificationQueue");
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't load the queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(targetUid: string, decision: "approve" | "reject") {
    setActingUid(targetUid);
    setError(null);
    try {
      await callApi("admin/reviewVerification", { targetUid, decision });
      setItems((prev) => prev.filter((i) => i.uid !== targetUid));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't submit your decision.");
    } finally {
      setActingUid(null);
    }
  }

  return (
    <Card>
      <CardTitle>Verification queue</CardTitle>
      <CardDescription className="mt-1">Helpers and professionals awaiting review.</CardDescription>

      {error && (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Nothing to review" description="Everyone's caught up." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.uid} className="rounded-lg border border-ink/8 bg-paper-dim/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {item.displayName} <Badge tone="neutral">{item.role}</Badge>
                    {item.helperPath && <Badge tone="blue">{item.helperPath}</Badge>}
                  </p>
                  <p className="text-sm text-ink-muted">{item.email}</p>
                  {item.studentVerification && (
                    <p className="mt-1 text-xs text-ink-muted">
                      {item.studentVerification.collegeName} — {item.studentVerification.collegeEmail}{" "}
                      {item.studentVerification.collegeEmailDomainLooksEducational ? (
                        <Badge tone="teal">domain looks educational</Badge>
                      ) : (
                        <Badge tone="yellow">domain unverified</Badge>
                      )}
                    </p>
                  )}
                  {item.helperPath === "volunteer" && (
                    <p className="mt-1 text-xs text-ink-muted">
                      Training: {item.trainingCompleted ? "complete" : "incomplete"} · Test:{" "}
                      {item.testPassed ? "passed" : "not passed"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" onClick={() => review(item.uid, "approve")} isLoading={actingUid === item.uid}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => review(item.uid, "reject")}
                    disabled={actingUid === item.uid}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function AdminDashboard() {
  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">Admin</h1>
      <p className="mt-1 text-ink-muted">Platform oversight and moderation.</p>

      <div className="mt-6">
        <VerificationQueue />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <ComingSoon
          title="Safety incidents"
          description="Review flagged crisis events and moderation escalations."
          phase="Phase 6"
        />
        <ComingSoon
          title="Reports"
          description="Investigate reports filed by clients and helpers."
          phase="Phase 6"
        />
        <ComingSoon
          title="Platform settings"
          description="Configure training pass score, reward formula, and crisis resources."
          phase="Phase 5 / 6"
        />
        <ComingSoon
          title="Audit log viewer"
          description="Every sensitive admin action, with actor, target, and timestamp."
          phase="Phase 6"
        />
      </div>
    </AppShell>
  );
}
