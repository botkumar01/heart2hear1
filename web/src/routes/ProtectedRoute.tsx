import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spinner } from "../components/ui/States";
import type { Role } from "../lib/roles";

/**
 * Gate a route subtree by signed-in state and, optionally, role.
 * Role comes only from AuthContext's decoded ID token claim — the same
 * claim Firestore Security Rules and Cloud Functions trust — so this can
 * never be bypassed by anything the client itself can edit.
 */
export function ProtectedRoute({ allow }: { allow?: Role[] }) {
  const { user, role, initializing } = useAuth();

  if (initializing) {
    return <Spinner label="Checking your session…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    // Signed in, but completeRegistration hasn't run yet for this account.
    return <Navigate to="/register" replace />;
  }

  if (allow && !allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
