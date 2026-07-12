import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { AuthUser, UserRole } from "../lib/auth";

export function ProtectedRoute({
  children,
  roles
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { loggedIn, user } = useAuth();
  const location = useLocation();

  if (!loggedIn) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    const fallback =
      user.role === "teacher" ? "/teacher" : user.role === "parent" ? "/parent" : "/student";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

export function roleHome(user: AuthUser | null): string {
  if (!user) return "/dashboard";
  if (user.role === "teacher") return "/teacher";
  if (user.role === "parent") return "/parent";
  if (user.role === "student") return "/student";
  return "/dashboard";
}
