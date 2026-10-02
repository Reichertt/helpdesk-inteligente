import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function RotaProtegida() {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />;
  return <Outlet />;
}
