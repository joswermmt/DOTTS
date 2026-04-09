import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type Rol } from "../auth/AuthContext";

type Props = {
  children: ReactNode;
  roles?: Rol[];
};

export function ProtectedRoute({ children, roles }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.rol)) {
    return <Navigate to="/panel" replace />;
  }
  return children;
}
