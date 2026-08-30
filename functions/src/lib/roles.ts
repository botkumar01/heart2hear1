// The four Heart2Hear roles. "admin" is never assignable through
// completeRegistration — admins are provisioned manually via the
// Firebase Console / an admin script, never through self-service signup.
export const SELF_SERVICE_ROLES = ["client", "helper", "professional"] as const;
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const ALL_ROLES = [...SELF_SERVICE_ROLES, "admin"] as const;
export type Role = (typeof ALL_ROLES)[number];

export function isSelfServiceRole(value: unknown): value is SelfServiceRole {
  return (SELF_SERVICE_ROLES as readonly string[]).includes(value as string);
}
