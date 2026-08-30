import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Spinner, EmptyState } from "../ui/States";
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
  professionalVerification: { registrationNumber?: string; registrationCouncil?: string } | null;
  officialRegisterUrl: string | null;
}

export function VerificationQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingUid, setActingUid] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await callApi<{ items: QueueItem[] }>("adminListVerificationQueue");
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
      await callApi("adminReviewVerification", { targetUid, decision });
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
                  {item.professionalVerification && (
                    <p className="mt-1 text-xs text-ink-muted">
                      Reg #{item.professionalVerification.registrationNumber} ·{" "}
                      {item.professionalVerification.registrationCouncil}
                      {item.officialRegisterUrl && (
                        <>
                          {" · "}
                          <a
                            href={item.officialRegisterUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-600 hover:underline"
                          >
                            Look up on official register
                          </a>
                        </>
                      )}
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
