import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { selectAdmin, selectToken } from "./authSlice";
import { useMeQuery } from "./authApi";
import { useCan } from "./useCan";
import NoAccess from "@/pages/NoAccess";

// Signed-in area: loads who the admin is and what they may do before showing anything
export function RequireAuth() {
  const token = useSelector(selectToken);
  const admin = useSelector(selectAdmin);
  const location = useLocation();
  const { isError, error, refetch } = useMeQuery(undefined, { skip: !token });

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!admin) {
    if (isError && error?.status !== 401) {
      return (
        <div className="grid min-h-svh place-items-center p-6 text-center">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Couldn't load your admin profile.</p>
            <button className="text-sm font-medium text-primary underline" onClick={refetch}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="grid min-h-svh place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  return <Outlet />;
}

// Shows the page only to admins with the permission
export function RequirePermission({ permission, children }) {
  return useCan(permission) ? children : <NoAccess />;
}
