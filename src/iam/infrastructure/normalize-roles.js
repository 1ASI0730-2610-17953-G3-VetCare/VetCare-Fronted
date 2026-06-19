export function normalizeRoles(roles) {
  return (roles || []).map((role) => String(role).toLowerCase());
}
