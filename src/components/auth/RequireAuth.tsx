import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken, USE_MOCKS } from '../../lib/api';
import type { ReactNode } from 'react';

type Props = { children: ReactNode };

export default function RequireAuth({ children }: Props) {
  const location = useLocation();
  if (USE_MOCKS) return <>{children}</>;
  const token = getAccessToken();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
