import type { DecodedIdToken } from "firebase-admin/auth";
import { permissionDenied } from "./errors.js";

export const SELF_SERVICE_ROLES = ["client", "helper", "professional"] as const;
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const ALL_ROLES = [...SELF_SERVICE_ROLES, "admin"] as const;
export type Role = (typeof ALL_ROLES)[number];

export function assertRole(decoded: DecodedIdToken, ...allowed: Role[]) {
  const role = decoded.role as Role | undefined;
  if (!role || !allowed.includes(role)) {
    throw permissionDenied();
  }
  return role;
}
