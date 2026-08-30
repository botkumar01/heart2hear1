import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Alert } from "../ui/Alert";
import { Spinner, EmptyState } from "../ui/States";
import { callApi, ApiRequestError } from "../../lib/api";

interface AuditEntry {
  id: string;
  actorUid: string;
  action: string;
  targetUid: string | null;
  reason: string | null;
  createdAt: { seconds: number } | null;
}

export function AuditLog() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callApi<{ items: AuditEntry[] }>("adminListAuditLogs")
      .then((data) => setItems(data.items))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Couldn't load the audit log."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardTitle>Audit log</CardTitle>
      <CardDescription className="mt-1">Every sensitive admin action, most recent first.</CardDescription>

      {error && (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No admin actions yet" />
        </div>
      ) : (
        <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-paper-dim px-3 py-2 text-sm">
              <div>
                <Badge tone="neutral">{item.action}</Badge>
                {item.targetUid && <span className="ml-2 text-xs text-ink-faint">target: {item.targetUid}</span>}
                {item.reason && <p className="mt-1 text-xs text-ink-muted">{item.reason}</p>}
              </div>
              {item.createdAt && (
                <span className="shrink-0 text-xs text-ink-faint">
                  {new Date(item.createdAt.seconds * 1000).toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
