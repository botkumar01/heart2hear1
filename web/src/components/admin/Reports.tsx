import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Spinner, EmptyState } from "../ui/States";
import { callApi, ApiRequestError } from "../../lib/api";

interface Report {
  id: string;
  reporterUid: string;
  targetUid: string | null;
  category: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
}

export function Reports() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await callApi<{ items: Report[] }>("adminListReports");
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(reportId: string, status: Report["status"]) {
    setActingId(reportId);
    try {
      await callApi("adminUpdateReportStatus", { reportId, status });
      setItems((prev) => prev.map((i) => (i.id === reportId ? { ...i, status } : i)));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't update this report.");
    } finally {
      setActingId(null);
    }
  }

  const open = items.filter((i) => i.status === "OPEN" || i.status === "UNDER_REVIEW");

  return (
    <Card>
      <CardTitle>Reports</CardTitle>
      <CardDescription className="mt-1">Concerns filed by clients and helpers.</CardDescription>

      {error && (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : open.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No open reports" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {open.map((item) => (
            <div key={item.id} className="rounded-lg border border-ink/8 bg-paper-dim/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone="neutral">{item.category.replace(/_/g, " ")}</Badge>
                  <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" isLoading={actingId === item.id} onClick={() => updateStatus(item.id, "DISMISSED")}>
                    Dismiss
                  </Button>
                  <Button size="sm" isLoading={actingId === item.id} onClick={() => updateStatus(item.id, "RESOLVED")}>
                    Resolve
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
