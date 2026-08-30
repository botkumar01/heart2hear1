import { Alert } from "./ui/Alert";
import type { Role } from "../lib/roles";

const COPY: Partial<Record<Role, string>> = {
  helper:
    "Heart2Hear helpers provide supportive listening. They are not doctors, therapists, or licensed professionals, and cannot diagnose or prescribe.",
  professional:
    "Professional consultations are provided by independently verified professionals within their own lawful scope of practice.",
};

/**
 * A small, role-specific reminder of the AI / helper / professional /
 * emergency boundary from the spec (§81, §82). Rendered once per relevant
 * screen — never stacked as a wall of disclaimers.
 */
export function BoundaryNotice({ role }: { role: Role }) {
  const copy = COPY[role];
  if (!copy) return null;
  return (
    <Alert tone="info" className="text-ink-muted">
      {copy}
    </Alert>
  );
}

export function EmergencyNotice() {
  return (
    <Alert tone="warning" title="If you are in immediate danger">
      Heart2Hear is not an emergency service. In an emergency, contact local emergency services or a
      crisis helpline right away.
    </Alert>
  );
}
