import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * Guard for the admin dashboard. Acts client-side only — the real security
 * lives in the Express JWT middleware. Users without a stored token are
 * bounced to the admin login page.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('hb_token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}