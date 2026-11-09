import { useSelector } from "react-redux";
import { selectAdmin, selectPermissions } from "./authSlice";

// True when the signed-in admin holds the permission (any of them, for an array)
export function useCan(permission) {
  const permissions = useSelector(selectPermissions);
  const admin = useSelector(selectAdmin);
  if (!permission || (Array.isArray(permission) && permission.length === 0)) return true;
  if (admin?.is_base) return true;
  const wanted = Array.isArray(permission) ? permission : [permission];
  return wanted.some((name) => permissions.includes(name));
}
