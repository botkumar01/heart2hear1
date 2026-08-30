// Mirrors functions/src/lib/roles.ts. Kept as a small, independent copy
// rather than a shared package — the list is short and stable, and a
// workspace/shared-package setup would be overhead this project doesn't
// need yet.
export const SELF_SERVICE_ROLES = ["client", "helper", "professional"] as const;
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const ALL_ROLES = [...SELF_SERVICE_ROLES, "admin"] as const;
export type Role = (typeof ALL_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  client: "Client",
  helper: "Helper",
  professional: "Professional",
  admin: "Admin",
};

export const ROLE_HOME_PATH: Record<Role, string> = {
  client: "/client",
  helper: "/helper",
  professional: "/professional",
  admin: "/admin",
};
