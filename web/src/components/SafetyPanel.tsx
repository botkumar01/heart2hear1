import { Card } from "./ui/Card";
import { Alert } from "./ui/Alert";
import { getCrisisResources } from "../lib/crisisResources";

export function SafetyPanel({ countryCode = "IN" }: { countryCode?: string }) {
  const { countryName, resources } = getCrisisResources(countryCode);

  return (
    <Card className="border-danger-500/30">
      <Alert tone="danger" title="You deserve immediate support">
        Heart2Hear isn't an emergency service. If you're in immediate danger, please contact one of
        the resources below right now.
      </Alert>
      <div className="mt-4 space-y-3">
        {resources.map((r) => (
          <div key={r.name} className="rounded-lg bg-paper-dim px-4 py-3">
            <p className="font-medium text-ink">{r.name}</p>
            <p className="text-sm text-ink-muted">{r.description}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              {r.phone && (
                <a
                  href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}
                  className="font-semibold text-teal-600 hover:underline"
                >
                  Call {r.phone}
                </a>
              )}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-teal-600 hover:underline"
                >
                  Visit site
                </a>
              )}
              {r.availability && <span className="text-ink-faint">{r.availability}</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Resources shown for {countryName}.</p>
    </Card>
  );
}
