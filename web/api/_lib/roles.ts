export const SELF_SERVICE_ROLES = ["client", "helper", "professional"] as const;
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const ALL_ROLES = [...SELF_SERVICE_ROLES, "admin"] as const;
export type Role = (typeof ALL_ROLES)[number];
