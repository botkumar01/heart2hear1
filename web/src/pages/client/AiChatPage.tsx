import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { SafetyPanel } from "../../components/SafetyPanel";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Spinner } from "../../components/ui/States";
import { useAiConversation } from "../../hooks/useAiConversation";
import { useUserProfile } from "../../hooks/useUserProfile";
import { callApi, ApiRequestError } from "../../lib/api";
import { cn } from "../../lib/cn";

export function AiChatPage() {
  const { messages, loading } = useAiConversation();
  const { profile } = useUserProfile();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setInput("");
    setSending(true);
    setError(null);
    try {
      const language = (profile?.languagePreference as string) ?? "en";
      const result = await callApi<{ reply: string; escalate: boolean }>("aiChat", {
        message,
        language,
      });
      if (result.escalate) setEscalated(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    if (!confirm("Clear this entire conversation? This can't be undone.")) return;
    setClearing(true);
    try {
      await callApi("deleteAiConversation");
      setEscalated(false);
    } catch {
      setError("Couldn't clear the conversation. Please try again.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Heart2Hear AI</h1>
            <p className="text-sm text-ink-muted">I'm an AI support assistant, not a doctor or therapist.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleClear} disabled={clearing || messages.length === 0}>
            Clear chat
          </Button>
        </div>

        {escalated && (
          <div className="mt-4">
            <SafetyPanel />
          </div>
        )}

        <div className="mt-4 space-y-3 rounded-xl border border-ink/8 bg-surface p-4">
          {loading ? (
            <Spinner label="Loading conversation…" />
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              Say hello — this is a private, judgment-free space to share how you're feeling.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                    m.role === "user"
                      ? "bg-teal-500 text-white"
                      : m.escalated
                        ? "bg-danger-100 text-danger-600"
                        : "bg-paper-dim text-ink",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mt-3">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        <form className="mt-4 flex gap-2" onSubmit={handleSend}>
          <input
            className="flex-1 rounded-md border border-ink/15 bg-surface px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Type how you're feeling…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" isLoading={sending} disabled={!input.trim()}>
            Send
          </Button>
        </form>

        <p className="mt-3 text-center text-xs text-ink-faint">
          Not comfortable with AI right now?{" "}
          <Link to="/client" className="underline hover:text-ink-muted">
            Back to dashboard
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
