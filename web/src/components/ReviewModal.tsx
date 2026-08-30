import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { cn } from "../lib/cn";
import { callApi, ApiRequestError } from "../lib/api";

export function ReviewModal({
  open,
  onClose,
  sessionId,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feltHeard, setFeltHeard] = useState<boolean | null>(null);
  const [wantsProfessional, setWantsProfessional] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await callApi("submitHelperReview", {
        sessionId,
        rating,
        comment: comment.trim() || undefined,
        feltHeard: feltHeard ?? undefined,
        wantsProfessionalSupport: wantsProfessional ?? undefined,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="How was your session?">
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star`}
              className={cn("text-3xl", n <= rating ? "text-yellow-500" : "text-ink-faint")}
            >
              ★
            </button>
          ))}
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Did you feel heard?</p>
          <div className="mt-1 flex gap-2">
            {[
              { v: true, label: "Yes" },
              { v: false, label: "Not really" },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => setFeltHeard(opt.v)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  feltHeard === opt.v ? "border-teal-500 bg-teal-500 text-white" : "border-ink/15 text-ink-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Would you like professional support?</p>
          <div className="mt-1 flex gap-2">
            {[
              { v: true, label: "Yes" },
              { v: false, label: "No, this was enough" },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => setWantsProfessional(opt.v)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  wantsProfessional === opt.v
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-ink/15 text-ink-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          className="w-full rounded-md border border-ink/15 bg-surface px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          rows={3}
          maxLength={1000}
          placeholder="Anything else you'd like to share? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <Button onClick={handleSubmit} isLoading={submitting} disabled={rating === 0} className="w-full">
          Submit review
        </Button>
      </div>
    </Modal>
  );
}
