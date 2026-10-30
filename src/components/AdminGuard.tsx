import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  </div>
);

export const AdminGuard = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

export default AdminGuard;
