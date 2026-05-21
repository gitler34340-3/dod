import { useAuth } from '@/app/contexts/AuthContext';
import { MyDocumentsScreen } from './MyDocumentsScreen';
import { AdminDocumentsScreen } from './AdminDocumentsScreen';

export function DocumentsScreen() {
  const { user } = useAuth();

  // Показать компонент в зависимости от роли пользователя
  if (user?.role === 'Employee') {
    return <MyDocumentsScreen />;
  } else if (['Admin', 'HR'].includes(user?.role || '')) {
    return <AdminDocumentsScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <p style={{ color: 'var(--text-secondary)' }}>Нет доступа к документам</p>
      </div>
    </div>
  );
}
