/**
 * Permission model. Roles are DB rows holding a list of permissions;
 * "*" grants everything. New staff roles (MANAGER, CONTENT_MANAGER, WAREHOUSE)
 * only need a Role row — see prisma/seed.ts for examples.
 */
export const PERMISSIONS = [
  "admin:access",
  "dashboard:read",
  "products:write",
  "inventory:write",
  "orders:read",
  "orders:write",
  "customers:read",
  "promocodes:write",
  "cms:write",
  "logs:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_KEYS = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CONTENT_MANAGER: "CONTENT_MANAGER",
  WAREHOUSE: "WAREHOUSE",
} as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  CUSTOMER: [],
  ADMIN: ["*"],
  MANAGER: ["admin:access", "dashboard:read", "orders:read", "orders:write", "customers:read", "inventory:write"],
  CONTENT_MANAGER: ["admin:access", "products:write", "cms:write"],
  WAREHOUSE: ["admin:access", "inventory:write", "orders:read"],
};

export function hasPermission(permissions: readonly string[] | undefined, perm: Permission) {
  if (!permissions) return false;
  return permissions.includes("*") || permissions.includes(perm);
}
