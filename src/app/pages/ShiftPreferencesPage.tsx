import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShiftPreferencesForm } from '@/app/components/ShiftPreferencesForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, Calendar } from 'lucide-react';

interface User {
  role: string;
  employeeId?: string;
}

export function ShiftPreferencesPage() {
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
          <Calendar className="w-12 h-12 mx-auto opacity-50 mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'Employee') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass rounded-2xl border-0 card-shadow">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Эта страница только для рабочих</h3>
                <p className="text-gray-600">
                  Администраторы и менеджеры используют{' '}
                  <a href="/admin/schedule" className="text-blue-600 hover:underline">
                    другой интерфейс для управления графиком
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Calendar className="w-10 h-10" />
          Мой график на неделю
        </h1>
        <p className="text-gray-600">
          Подайте пожелания о том, когда вам удобно работать на следующей неделе
        </p>
      </div>

      <ShiftPreferencesForm />
    </div>
  );
}
