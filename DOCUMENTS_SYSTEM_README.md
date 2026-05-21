# Система управления документами

## Описание

Полнофункциональная система управления документами с поддержкой:
- **Для сотрудников**: загрузка, просмотр, архивирование и удаление своих документов
- **Для администраторов**: полное управление документами всех сотрудников и экспорт данных

## Структура

### Backend

#### Базы данных (Prisma Schema)
```prisma
model Document {
  id             String   @id @default(cuid())
  title          String
  description    String?
  type           String   @default("document") // document, certificate, contract
  status         String   @default("active") // active, archived, pending
  ownerId        String   @map("owner_id")
  owner          User     @relation("DocumentOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  
  fileName       String?
  fileUrl        String?
  
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@map("documents")
}
```

#### API Endpoints

##### Для всех пользователей (требуется authentication):

**GET** `/documents/my`
- Получить список своих документов
- Response: `Document[]`

**GET** `/documents/:id`
- Получить документ по ID
- Response: `Document`

**POST** `/documents`
- Создать новый документ
- Body: `CreateDocumentDto`
- Response: `DocumentResponseDto`

**PUT** `/documents/:id`
- Обновить документ
- Body: `UpdateDocumentDto`
- Response: `DocumentResponseDto`

**DELETE** `/documents/:id`
- Удалить документ
- Response: `{ message: string }`

**PUT** `/documents/:id/archive`
- Архивировать документ
- Response: `DocumentResponseDto`

**PUT** `/documents/:id/restore`
- Восстановить архивированный документ
- Response: `DocumentResponseDto`

##### Только для Admin/HR:

**GET** `/documents/all`
- Получить список всех документов
- Response: `Document[]` (с информацией о владельце)

**GET** `/documents/export/json`
- Экспортировать все документы в JSON
- Response: JSON файл

### Frontend

#### React компоненты

**MyDocumentsScreen** (`src/app/components/MyDocumentsScreen.tsx`)
- Экран для сотрудников
- Функциональность:
  - ✅ Просмотр своих документов
  - ✅ Загрузка новых документов
  - ✅ Скачивание файлов
  - ✅ Архивирование документов
  - ✅ Удаление документов
  - ✅ Фильтрация по типу

**AdminDocumentsScreen** (`src/app/components/AdminDocumentsScreen.tsx`)
- Экран для администраторов
- Функциональность:
  - ✅ Просмотр всех документов
  - ✅ Поиск документов по названию/email
  - ✅ Фильтрация по статусу и типу
  - ✅ Архивирование/восстановление
  - ✅ Удаление документов
  - ✅ Скачивание файлов
  - ✅ Экспорт всех документов в JSON
  - ✅ Статистика (Всего/Активных/Архивированных)

## Типы документов

```
- document  : Документ (по умолчанию)
- certificate : Сертификат
- contract  : Контракт
```

## Статусы документов

```
- active    : Активный документ
- archived  : Архивированный документ
- pending   : В ожидании исправлений
```

## Data Transfer Objects (DTO)

### CreateDocumentDto
```typescript
{
  title: string;           // Обязательное
  description?: string;    // Необязательное
  type?: string;          // По умолчанию: "document"
  fileUrl?: string;       // URL файла
  fileName?: string;      // Имя файла
}
```

### UpdateDocumentDto
```typescript
{
  title?: string;
  description?: string;
  type?: string;
  status?: string;        // Может быть установлено админом
  fileUrl?: string;
  fileName?: string;
}
```

### DocumentResponseDto
```typescript
{
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  fileName?: string;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Контроль доступа

### Правило 1: Просмотр документов
- **Сотрудник**: может видеть только свои документы
- **Admin/HR**: может видеть все документы

### Правило 2: Редактирование/Удаление
- **Сотрудник**: может редактировать/удалять только свои документы
- **Admin/HR**: может редактировать/удалять любые документы

### Правило 3: Архивирование
- Доступно владельцу документа и Admin/HR

### Правило 4: Экспорт
- Доступно только Admin/HR

## Установка и миграция

1. **Обновить Prisma схему** (уже сделано):
```bash
# Schema уже содержит модель Document
```

2. **Запустить миграцию**:
```bash
cd backend
npx prisma migrate deploy
# или для dev:
npx prisma migrate dev --name add_documents
```

3. **Убедиться что модуль добавлен в AppModule**:
```typescript
// backend/src/app.module.ts
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    // ... другие модули
    DocumentsModule,
  ],
})
export class AppModule {}
```

## Использование в приложении

### Добавление маршрутов

В `App.tsx` или главном компоненте:

```typescript
import { MyDocumentsScreen } from './components/MyDocumentsScreen';
import { AdminDocumentsScreen } from './components/AdminDocumentsScreen';

// В роутере:
{
  path: '/documents',
  element: user.role === 'Employee' ? <MyDocumentsScreen /> : <AdminDocumentsScreen />,
  requiredRole: ['Employee', 'Admin', 'HR'],
}
```

### Добавление в навигационное меню

```typescript
const menuItems = [
  // ... другие пункты
  {
    label: user.role === 'Employee' ? 'Мои документы' : 'Управление документами',
    icon: FileText,
    path: '/documents',
    roles: ['Employee', 'Admin', 'HR'],
  },
];
```

## Примеры использования

### Получить свои документы (Frontend)
```typescript
const response = await fetch(`${API_URL}/documents/my`, {
  headers: { Authorization: `Bearer ${token}` },
});
const documents = await response.json();
```

### Создать новый документ
```typescript
const response = await fetch(`${API_URL}/documents`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: 'Мой контракт',
    description: 'Трудовой договор',
    type: 'contract',
  }),
});
```

### Экспортировать документы (Admin)
```typescript
const response = await fetch(`${API_URL}/documents/export/json`, {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await response.blob();
// Скачать файл
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'documents.json';
a.click();
```

## Безопасность

✅ **Реализованные проверки**:
- Проверка токена JWT для всех endpoints
- Проверка прав доступа (только свои документы для сотрудников)
- Удаление документов при удалении пользователя (onDelete: Cascade)
- Валидация на основе role пользователя

## Расширения в будущем

- [ ] Групповой доступ к документам
- [ ] Комментарии и обсуждения документов
- [ ] История изменений документов
- [ ] Подписание электронных документов
- [ ] Интеграция с системой хранения файлов
- [ ] Экспорт в CSV/Excel
- [ ] Печать документов

## Типичные ошибки и решения

### 403 Forbidden при доступе к чужому документу
- Проверьте, что вы владелец документа или администратор

### 404 Document not found
- Проверьте ID документа
- Убедитесь, что документ существует в БД

### Failed to create document
- Убедитесь, что токен действителен
- Проверьте что поле `title` заполнено

## Тестирование

С помощью curl:

```bash
# Получить свои документы
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/documents/my

# Создать документ
curl -X POST http://localhost:3001/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","type":"document"}'

# Удалить документ
curl -X DELETE http://localhost:3001/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```
