import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Spinner, EmptyState } from "../ui/States";
import { callApi, ApiRequestError } from "../../lib/api";

interface SafetyEvent {
  id: string;
  uid: string;
  source: string;
  severity: "LOW" | "MEDIUM" | "CRISIS";
  categories: string[];
  excerpt: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  createdAt: { seconds: number } | null;
}

const SEVERITY_TONE = { LOW: "neutral", MEDIUM: "yellow", CRISIS: "danger" } as const;

export function SafetyIncidents() {
  const [items, setItems] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await callApi<{ items: SafetyEvent[] }>("adminListSafetyEvents");
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't load safety events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(eventId: string, status: "UNDER_REVIEW" | "RESOLVED") {
    setActingId(eventId);
    try {
      await callApi("adminUpdateSafetyEventStatus", { eventId, status });
      setItems((prev) => prev.map((i) => (i.id === eventId ? { ...i, status } : i)));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't update this event.");
    } finally {
      setActingId(null);
    }
  }

  const open = items.filter((i) => i.status !== "RESOLVED");

  return (
    <Card>
      <CardTitle>Safety incidents</CardTitle>
      <CardDescription className="mt-1">Flagged crisis events and moderation escalations.</CardDescription>

      {error && (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : open.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No open safety events" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {open.map((item) => (
            <div key={item.id} className="rounded-lg border border-ink/8 bg-paper-dim/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={SEVERITY_TONE[item.severity]}>{item.severity}</Badge>
                    <Badge tone="neutral">{item.source}</Badge>
                    <span className="text-xs text-ink-faint">{item.categories.join(", ")}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">"{item.excerpt}"</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {item.status === "OPEN" && (
                    <Button size="sm" variant="secondary" isLoading={actingId === item.id} onClick={() => updateStatus(item.id, "UNDER_REVIEW")}>
                      Mark reviewing
                    </Button>
                  )}
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
