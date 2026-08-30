import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { Label, Select } from "./ui/Field";
import { callApi, ApiRequestError } from "../lib/api";

const CATEGORIES = [
  { value: "inappropriate_behavior", label: "Inappropriate behavior" },
  { value: "medical_advice", label: "Gave medical advice" },
  { value: "harassment", label: "Harassment" },
  { value: "unsafe_behavior", label: "Unsafe behavior" },
  { value: "privacy_violation", label: "Privacy violation" },
  { value: "impersonation", label: "Impersonation" },
  { value: "abuse", label: "Abuse" },
  { value: "threats", label: "Threats" },
  { value: "other", label: "Other" },
] as const;

export function ReportModal({
  open,
  onClose,
  sessionId,
}: {
  open: boolean;
  onClose: () => void;
  sessionId?: string;
}) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("inappropriate_behavior");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await callApi("submitReport", { sessionId, category, description });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't submit the report.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSubmitted(false);
    setDescription("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Report an issue">
      {submitted ? (
        <div>
          <Alert tone="success">Thanks — an admin will review this.</Alert>
          <Button className="mt-4" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <div>
            <Label htmlFor="report-category">What happened?</Label>
            <Select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="report-description">Details</Label>
            <textarea
              id="report-description"
              className="w-full rounded-md border border-ink/15 bg-surface px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} isLoading={submitting} disabled={!description.trim()} className="w-full">
            Submit report
          </Button>
        </div>
      )}
    </Modal>
  );
}
