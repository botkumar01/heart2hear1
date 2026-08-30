import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { Spinner, EmptyState } from "../../components/ui/States";
import { callApi, ApiRequestError } from "../../lib/api";

interface HelperListing {
  uid: string;
  displayName: string;
  languagePreference: string;
  certificationLevel: number;
  completedSessions: number;
  averageRating: number | null;
  ratingCount: number;
}

const LANGUAGE_LABEL: Record<string, string> = { en: "English", ta: "Tamil", hi: "Hindi" };

export function HelperDirectoryPage() {
  const navigate = useNavigate();
  const [helpers, setHelpers] = useState<HelperListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingUid, setRequestingUid] = useState<string | null>(null);

  useEffect(() => {
    callApi<{ helpers: HelperListing[] }>("browseHelpers")
      .then((data) => setHelpers(data.helpers))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Couldn't load helpers."))
      .finally(() => setLoading(false));
  }, []);

  async function requestSession(helperUid: string) {
    setRequestingUid(helperUid);
    setError(null);
    try {
      const { sessionId } = await callApi<{ sessionId: string }>("requestHelperSession", { helperUid });
      navigate(`/session/${sessionId}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't request a session.");
      setRequestingUid(null);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">Find a Helper</h1>
      <p className="mt-1 text-ink-muted">Trained Heart2Hear listeners, available right now.</p>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : helpers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No helpers available right now"
            description="Check back soon, or talk to Heart2Hear AI in the meantime."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {helpers.map((h) => (
            <Card key={h.uid}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{h.displayName}</CardTitle>
                  <CardDescription className="mt-1">Trained Heart2Hear Helper</CardDescription>
                </div>
                <Badge tone="blue">{LANGUAGE_LABEL[h.languagePreference] ?? h.languagePreference}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
                {h.averageRating !== null && (
                  <span>
                    ★ {h.averageRating.toFixed(1)} ({h.ratingCount})
                  </span>
                )}
                <span>{h.completedSessions} sessions completed</span>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => requestSession(h.uid)}
                isLoading={requestingUid === h.uid}
              >
                Request to talk
              </Button>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
