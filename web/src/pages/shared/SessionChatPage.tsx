import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { BoundaryNotice } from "../../components/BoundaryNotice";
import { SafetyPanel } from "../../components/SafetyPanel";
import { ReportModal } from "../../components/ReportModal";
import { ReviewModal } from "../../components/ReviewModal";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { Spinner, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../contexts/AuthContext";
import { useSession } from "../../hooks/useSession";
import { callApi, ApiRequestError } from "../../lib/api";
import { cn } from "../../lib/cn";

const STATUS_TONE: Record<string, "teal" | "blue" | "yellow" | "danger" | "neutral"> = {
  REQUESTED: "yellow",
  ACTIVE: "teal",
  COMPLETED: "blue",
  REVIEWED: "blue",
  CANCELLED: "neutral",
  SAFETY_ESCALATED: "danger",
};

export function SessionChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const { session, messages, loading } = useSession(sessionId);

  const isHelperSide = role === "helper";
  const homePath = isHelperSide ? "/helper" : "/client";

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function respond(decision: "accept" | "decline") {
    if (!sessionId) return;
    setResponding(true);
    setError(null);
    try {
      await callApi("respondToSessionRequest", { sessionId, decision });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setResponding(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !sessionId || sending) return;
    setInput("");
    setSending(true);
    setError(null);
    setWarning(null);
    try {
      const result = await callApi<{ blocked: boolean; warning?: string; suspended?: boolean; escalate?: boolean }>(
        "sendSessionMessage",
        { sessionId, text },
      );
      if (result.blocked && result.warning) {
        setWarning(
          result.suspended
            ? `${result.warning}\n\nDue to repeated violations, your helper account has been suspended pending admin review.`
            : result.warning,
        );
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  async function handleEndSession() {
    if (!sessionId || !confirm("End this session?")) return;
    try {
      await callApi("endSession", { sessionId });
    } catch {
      setError("Couldn't end the session. Please try again.");
    }
  }

  if (loading) {
    return (
      <AppShell>
        <Spinner label="Loading session…" />
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <EmptyState
          title="Session not found"
          action={
            <Link to={homePath}>
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="flex items-center justify-between">
          <Link to={homePath} className="text-sm text-ink-muted hover:text-ink">
            &larr; Back
          </Link>
          <Badge tone={STATUS_TONE[session.status] ?? "neutral"}>{session.status.replace("_", " ")}</Badge>
        </div>

        {isHelperSide && (
          <div className="mt-3">
            <BoundaryNotice role="helper" />
          </div>
        )}

        {session.status === "SAFETY_ESCALATED" && (
          <div className="mt-3">
            <SafetyPanel />
          </div>
        )}

        {error && (
          <div className="mt-3">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        {warning && (
          <div className="mt-3">
            <Alert tone="warning" title="Message not sent">
              <span className="whitespace-pre-line">{warning}</span>
            </Alert>
          </div>
        )}

        {session.status === "REQUESTED" && isHelperSide && (
          <Alert tone="info" className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <span>A client would like to talk with you.</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => respond("accept")} isLoading={responding}>
                  Accept
                </Button>
                <Button size="sm" variant="secondary" onClick={() => respond("decline")} disabled={responding}>
                  Decline
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {session.status === "REQUESTED" && !isHelperSide && (
          <Alert tone="info" className="mt-4">
            Waiting for the helper to accept your request…
          </Alert>
        )}

        {(session.status === "ACTIVE" || session.status === "SAFETY_ESCALATED" || session.status === "COMPLETED" || session.status === "REVIEWED") && (
          <div className="mt-4 space-y-3 rounded-xl border border-ink/8 bg-surface p-4">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">No messages yet — say hello.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={cn("flex", m.senderUid === user?.uid ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                      m.senderUid === user?.uid ? "bg-teal-500 text-white" : "bg-paper-dim text-ink",
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {session.status === "ACTIVE" && (
          <>
            <form className="mt-4 flex gap-2" onSubmit={handleSend}>
              <input
                className="flex-1 rounded-md border border-ink/15 bg-surface px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              <Button type="submit" isLoading={sending} disabled={!input.trim()}>
                Send
              </Button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              {isHelperSide && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setInput("I'm not able to advise on that, but a licensed professional would be a great next step — would you like help finding one?")}
                >
                  Refer to Professional
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setReportOpen(true)}>
                Report Issue
              </Button>
              <Button variant="danger" size="sm" onClick={handleEndSession}>
                End Session
              </Button>
            </div>
          </>
        )}

        {session.status === "SAFETY_ESCALATED" && (
          <div className="mt-4">
            <Button variant="danger" size="sm" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        )}

        {session.status === "COMPLETED" && !isHelperSide && (
          <Alert tone="success" className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <span>This session has ended.</span>
              <Button size="sm" onClick={() => setReviewOpen(true)}>
                Leave a review
              </Button>
            </div>
          </Alert>
        )}

        {session.status === "COMPLETED" && isHelperSide && (
          <Alert tone="success" className="mt-4">
            This session has ended. Thank you for helping.
          </Alert>
        )}

        {session.status === "REVIEWED" && (
          <Alert tone="success" className="mt-4">
            This session is complete — thanks for using Heart2Hear.
          </Alert>
        )}

        {session.status === "CANCELLED" && (
          <Alert tone="info" className="mt-4">
            This session was cancelled.
          </Alert>
        )}
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} sessionId={sessionId} />
      {sessionId && (
        <ReviewModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          sessionId={sessionId}
          onSubmitted={() => navigate(homePath)}
        />
      )}
    </AppShell>
  );
}
