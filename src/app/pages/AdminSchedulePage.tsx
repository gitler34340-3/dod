import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminScheduleManagement } from '@/app/components/AdminScheduleManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, LayoutGrid } from 'lucide-react';

interface User {
  role: string;
  employeeId?: string;
}

export function AdminSchedulePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получить информацию о текущем пользователе
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LayoutGrid className="w-12 h-12 mx-auto opacity-50 mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'Admin' && user?.role !== 'HR') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass rounded-2xl border-0 card-shadow">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Доступ запрещен</h3>
                <p className="text-gray-600">
                  Только администраторы и HR могут управлять графиком. Рабочим доступен{' '}
                  <a href="/my-preferences" className="text-blue-600 hover:underline">
                    интерфейс подачи пожеланий
                  </a>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminScheduleManagement />
    </div>
  );
}
