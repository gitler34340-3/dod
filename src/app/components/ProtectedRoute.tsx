import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { LoadingScreen } from '@/app/components/LoadingScreen';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <LoadingScreen message="Проверка сессии..." />;
  }

  if (!session?.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
