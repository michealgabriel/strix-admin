import { useCan } from "./useCan";

// Renders its children only for admins holding the permission
export function Can({ permission, children, fallback = null }) {
  return useCan(permission) ? children : fallback;
}
