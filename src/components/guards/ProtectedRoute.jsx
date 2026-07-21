import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';

// Mirror of the backend privilege ladder (models/roles.py).
const ROLE_LEVEL = { cliente: 1, empleado: 2, gerente: 3, desarrollador: 4 };

/**
 * Route guard.
 * - `roles`: exact-role allowlist (optional)
 * - `minRole`: "this role or above" via the privilege ladder (optional)
 * Redirects anonymous users to /login (preserving intended destination).
 */
export function ProtectedRoute({ children, roles, minRole }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="section flex-center" style={{ minHeight: '50vh' }}><Spinner /></div>;
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const allowedByList = !roles || roles.includes(user.role);
  const allowedByLevel = !minRole || (ROLE_LEVEL[user.role] ?? 0) >= (ROLE_LEVEL[minRole] ?? 99);

  if (!allowedByList || !allowedByLevel) {
    return <Navigate to="/panel" replace />;
  }
  return children;
}
