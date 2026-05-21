// Интеграция системы документов в приложение
// Добавьте эти импорты в App.tsx или main.tsx:

/*
import { MyDocumentsScreen } from './components/MyDocumentsScreen';
import { AdminDocumentsScreen } from './components/AdminDocumentsScreen';

// Добавьте маршруты в роутер:

if (userRole === 'Employee') {
  routes.push({
    path: '/documents',
    element: <MyDocumentsScreen />,
  });
} else if (['Admin', 'HR'].includes(userRole)) {
  routes.push({
    path: '/documents',
    element: <AdminDocumentsScreen />,
  });
}

// Или добавьте кнопки навигации в главное меню:

// Для сотрудников:
{
  label: 'Мои документы',
  icon: FileText,
  path: '/documents',
  roles: ['Employee'],
}

// Для администраторов:
{
  label: 'Управление документами',
  icon: FileText,
  path: '/documents',
  roles: ['Admin', 'HR'],
}
*/

// Пример использвания в компоненте навигации:
import { FileText } from 'lucide-react';

export const documentNavItems = [
  {
    label: 'Мои документы',
    icon: FileText,
    path: '/documents',
    roles: ['Employee'],
  },
  {
    label: 'Управление документами',
    icon: FileText,
    path: '/documents',
    roles: ['Admin', 'HR'],
  },
];

// API endpoints для документов:
/*
GET  /documents/my              - Получить документы текущего пользователя
GET  /documents/all             - Получить все документы (Admin/HR)
GET  /documents/:id             - Получить документ по ID
POST /documents                 - Создать новый документ
PUT  /documents/:id             - Обновить документ
DELETE /documents/:id           - Удалить документ
PUT  /documents/:id/archive     - Архивировать документ
PUT  /documents/:id/restore     - Восстановить документ
GET  /documents/export/json     - Экспортировать документы в JSON
*/
