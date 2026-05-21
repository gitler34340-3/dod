# ⚡ Hard Blocker: 6-Часовой Access Map
## Пошаговое Внедрение. По Каким Файлам Идти. Что Копировать.

**Версия:** 1.0  
**Время внедрения:** 6-8 часов для одного разработчика  
**Целевая аудитория:** Backend/Frontend разработчик с 2+ лет опыта

---

## 🎯 ТЫ ЗДЕСЬ ПРАВИЛЬНЫЙ ПУТЬ

### Структура Документов

```
📚 ВАШИ ДОКУМЕНТЫ (в проекте):

├─ DOCUMENTS_BUSINESS_RULES.md ← ВЫ СЕЙЧАС ЧИТАЕТЕ
│  └─ Откуда: таблицы БД, SQL, логика гейткипера
│  └─ Как использовать: С этого файла НАЧИНАЙТЕ!

├─ DOCUMENTS_GATEKEEPER_INTEGRATION.md
│  └─ Откуда: примеры кода, интеграции, flow
│  └─ Как использовать: Копируйте код отсюда

├─ DOCUMENTS_QUICK_START.md (старый)
│  └─ Откуда: готовые компоненты React
│  └─ Как использовать: Для UI/UX части (доп.)

└─ DOCUMENTS_MODULE_TECHNICAL_GUIDE.md (старый)
   └─ Откуда: глубокие примеры, архитектура
   └─ Как использовать: Справка + понимание
```

---

## 📋 Фаза 1: БАЗА ДАННЫХ (1 час)

**Что нужно сделать:**
1. Добавить таблицы в Prisma schema
2. Запустить миграцию
3. Засеять базовые doc_types

### Шаг 1.1: Обновить Prisma Schema

**Файл:** `backend/prisma/schema.prisma`

**Скопировать эти модели в конец файла:**

```prisma
// ============================================
// DOCUMENTS MODULE: Hard Blocker & Gatekeeper
// ============================================

model DocumentType {
  id            String   @id @default(cuid())
  name          String   @unique
  description   String?
  
  // 🔐 ГЛАВНОЕ: Обязательный документ?
  is_mandatory  Boolean  @default(false)
  
  validity_days Int      @default(365)
  icon_url      String?
  display_order Int      @default(0)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  employeeDocuments EmployeeDocument[]
  documentRequests  DocumentRequest[]
  
  @@index([is_mandatory])
}

model EmployeeDocument {
  id                String   @id @default(cuid())
  
  employee_id       String
  employee          Employee @relation(fields: [employee_id], references: [id], onDelete: Cascade)
  
  documentTypeId    String
  documentType      DocumentType @relation(fields: [documentTypeId], references: [id])
  
  title             String
  file_url          String
  file_size         Int?
  mime_type         String?
  
  // 🔴 Статусы: pending|approved|active|rejected|expired
  status            String   @default("pending")
  
  issued_date       DateTime?
  expiry_date       DateTime?
  
  reviewed_at       DateTime?
  reviewed_by       String?
  review_notes      String?
  
  // Связь на ордер (если был)
  request_id        String?
  request           DocumentRequest? @relation(fields: [request_id], references: [id], onDelete: SetNull)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  documentLogs      DocumentLog[]
  expiredAlerts     ExpiredDocumentAlert[]
  
  @@unique([employee_id, documentTypeId])
  @@index([employee_id])
  @@index([status])
  @@index([expiry_date])
}

model DocumentLog {
  id                String   @id @default(cuid())
  
  documentId        String
  document          EmployeeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  action            String   // approved|rejected|uploaded|expired
  actor_id          String?
  
  old_status        String?
  new_status        String?
  
  details           String? // JSON
  notes             String?
  
  createdAt         DateTime @default(now())
  
  @@index([documentId])
  @@index([action])
  @@index([createdAt])
}

model DocumentRequest {
  id                String   @id @default(cuid())
  
  requested_by      String   // ID админа
  
  employee_id       String
  employee          Employee @relation(fields: [employee_id], references: [id], onDelete: Cascade)
  
  documentTypeId    String
  documentType      DocumentType @relation(fields: [documentTypeId], references: [id])
  
  deadline          DateTime
  
  // pending|submitted|approved|rejected|completed
  status            String   @default("pending")
  
  priority          String   @default("normal") // high|normal|low
  message           String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  employeeDocuments EmployeeDocument[]
  
  @@index([employee_id])
  @@index([status])
  @@index([deadline])
}

model ExpiredDocumentAlert {
  id                String   @id @default(cuid())
  
  employee_id       String
  employee          Employee @relation(fields: [employee_id], references: [id], onDelete: Cascade)
  
  documentId        String
  document          EmployeeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  priority          String   @default("normal")
  alert_sent_at     DateTime?
  resolved_at       DateTime?
  
  createdAt         DateTime @default(now())
  
  @@index([employee_id])
  @@index([resolved_at])
}

model GatekeeperLog {
  id                String   @id @default(cuid())
  
  employee_id       String
  
  event_type        String   // access_allowed|access_blocked|document_required
  resource          String   // /shifts, /payroll, /schedule
  
  blocked_by_document_id    String?
  blocked_by_document_type  String?
  blocked_by_status         String?
  
  createdAt         DateTime @default(now())
  
  @@index([employee_id])
  @@index([event_type])
  @@index([createdAt])
}

// Расширение существующего Employee
model Employee {
  // ... существующие поля ...
  
  employeeDocuments     EmployeeDocument[]
  documentRequests      DocumentRequest[]
  expiredDocumentAlerts ExpiredDocumentAlert[]
  
  @@index([id])
}
```

### Шаг 1.2: Создать Миграцию

```bash
cd backend

# Создать миграцию
npx prisma migrate dev --name add_documents_hard_blocker

# Выберите имя: add_documents_hard_blocker
# Prisma создаст файл миграции в migrations/
```

### Шаг 1.3: Засеять Базовые Документы

**Файл:** `backend/prisma/seed.ts`

**Добавить в конец существующего seed:**

```typescript
async function seedDocumentTypes(prisma: PrismaClient) {
  const mandatoryDocs = [
    { name: 'Паспорт', validity_days: 3650 },
    { name: 'Медицинская книжка', validity_days: 365 },
    { name: 'ДМС страховка', validity_days: 365 },
    { name: 'Договор труда', validity_days: 1095 },
    { name: 'Справка санитарная', validity_days: 365 },
    { name: 'СНИЛС', validity_days: 3650 },
    { name: 'ИНН', validity_days: 3650 },
  ];

  for (const doc of mandatoryDocs) {
    await prisma.documentType.upsert({
      where: { name: doc.name },
      update: {},
      create: {
        name: doc.name,
        description: `Обязательный документ`,
        is_mandatory: true,
        validity_days: doc.validity_days,
        display_order: mandatoryDocs.indexOf(doc),
      },
    });
  }

  console.log('✅ Document types seeded');
}

// В функции main():
async function main() {
  // ... остальной code ...
  await seedDocumentTypes(prisma);
}
```

**Запустить seed:**
```bash
npx prisma db seed
```

---

## 💻 Фаза 2: BACKEND MIDDLEWARE (2 часа)

**Что нужно сделать:**
1. Создать GatekeeperMiddleware
2. Зарегистрировать в AppModule
3. Тестировать протокол 403

### Шаг 2.1: Создать Middleware

**Файл:** `backend/src/common/middlewares/gatekeeper.middleware.ts`

**СКОПИРОВАТЬ ПОЛНОСТЬЮ из DOCUMENTS_GATEKEEPER_INTEGRATION.md, раздел "1. Gatekeeper Middleware"**

(Ссылка на документацию: `DOCUMENTS_GATEKEEPER_INTEGRATION.md → Middleware Flow → Gatekeeper Middleware`)

### Шаг 2.2: Зарегистрировать Middleware

**Файл:** `backend/src/app.module.ts`

**Найти класс AppModule и добавить:**

```typescript
import { GatekeeperMiddleware } from './common/middlewares/gatekeeper.middleware';

@Module({
  imports: [/* ... */],
  controllers: [/* ... */],
  providers: [/* ... */],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Регистрировать для всех защищённых маршрутов
    consumer
      .apply(GatekeeperMiddleware)
      .forRoutes(
        'shifts',
        'schedule',
        'payroll',
        'achievements',
        'attendances',
        // Добавить остальные защищённые маршруты
      );
  }
}
```

### Шаг 2.3: REST Endpoint для Ордеров

**Файл:** `backend/src/document-requests/document-requests.controller.ts`

**СКОПИРОВАТЬ из DOCUMENTS_GATEKEEPER_INTEGRATION.md → "3. Контроллер для Создания Ордера"**

**Создать файл и пасту код полностью.**

---

## 📱 Фаза 3: ФРОНТЕНД (2 часа)

**Что нужно сделать:**
1. Создать GatekeeperBlockscreen компонент
2. Установить Context + Interceptor
3. Интегрировать в App.tsx

### Шаг 3.1: GatekeeperBlockscreen Компонент

**Файл:** `src/components/GatekeeperBlockscreen.tsx`

**СКОПИРОВАТЬ из DOCUMENTS_BUSINESS_RULES.md → "2. Компонент GatekeeperBlockscreen"**

### Шаг 3.2: Gatekeeper Context

**Файл:** `src/contexts/GatekeeperContext.tsx`

**СКОПИРОВАТЬ из DOCUMENTS_GATEKEEPER_INTEGRATION.md → "React Context для Гейткипера"**

### Шаг 3.3: Axios Interceptor

**Файл:** `src/api/axiosSetup.ts`

**СКОПИРОВАТЬ из DOCUMENTS_GATEKEEPER_INTEGRATION.md → "Axios Interceptor"**

### Шаг 3.4: Обновить main.tsx / index.tsx

**Файл:** `src/main.tsx`

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { GatekeeperProvider } from './contexts/GatekeeperContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GatekeeperProvider>
      <App />
    </GatekeeperProvider>
  </React.StrictMode>,
)
```

### Шаг 3.5: Обновить App.tsx

**Файл:** `src/App.tsx`

**СКОПИРОВАТЬ из DOCUMENTS_GATEKEEPER_INTEGRATION.md → "App.tsx с Гейткипер Экраном"**

---

## ✅ Фаза 4: ТЕСТИРОВАНИЕ (1 час)

### Тест 1: Сотрудник Без Документов

```bash
# 1. Запустить backend
cd backend && npm run start:dev

# 2. Запустить frontend
cd .. && npm run dev

# 3. Залогиниться как сотрудник
# использовать тестовую учётку

# 4. Попытаться открыть /shifts
# Ожидаемо: GatekeeperBlockscreen показывается

# 5. Загрузить тестовый документ
# Проверить: статус = pending

# 6. (Админ) Одобрить документ
# Статус → active

# 7. Попытаться открыть /shifts СНОВА
# Ожидаемо: Теперь видно расписание ✅
```

### Тест 2: Ордер от Админа

```bash
# 1. Залогиниться как админ

# 2. POST /api/document-requests
{
  "employee_id": "emp-123",
  "document_type_id": "doc-type-medical",
  "deadline": "2026-03-31T23:59:59Z",
  "priority": "high",
  "message": "СРОЧНО!"
}

# 3. Проверить, что сотрудник видит DocumentRequestBanner

# 4. Сотрудник загружает документ

# 5. Админ одобряет

# 6. Проверить, что бланер исчез ✅
```

### Тест 3: Просроченный Документ

```bash
# 1. Создать документ с expiry_date вчера

# 2. Попытаться открыть /shifts

# 3. Ожидаемо: GatekeeperBlockscreen с "EXPIRED"

# 4. Загрузить новый документ

# 5. Проверить, что блокировка снята ✅
```

---

## 🎨 Фаза 5: UI ПОЛИРОВКА (0.5 часа)

### Опционально: DocumentRequestBanner

**Файл:** `src/components/DocumentRequestBanner.tsx`

**СКОПИРОВАТЬ из DOCUMENTS_BUSINESS_RULES.md → "3. Срочная Телеграмма"**

### Опционально: Tailwind Классы

**Если нужно обновить цвета, скопировать из:**
`DOCUMENTS_QUICK_START.md → tailwind.config.ts`

---

## 📊 Быстрый Справочник: Где Копировать Что

| Что нужно | Откуда копировать | Куда вставлять |
|-----------|-------------------|-----------------|
| **Таблицы БД** | DOCUMENTS_BUSINESS_RULES.md (раздел "1. Таблица") | backend/prisma/schema.prisma |
| **Middleware** | DOCUMENTS_GATEKEEPER_INTEGRATION.md (раздел "1. Gatekeeper Middleware") | backend/src/common/middlewares/ |
| **Регистрация** | DOCUMENTS_GATEKEEPER_INTEGRATION.md (раздел "2. Регистрация") | backend/src/app.module.ts |
| **Контроллер Ордеров** | DOCUMENTS_GATEKEEPER_INTEGRATION.md (раздел "3. Контроллер") | backend/src/document-requests/ |
| **React Context** | DOCUMENTS_GATEKEEPER_INTEGRATION.md (раздел "React Context") | src/contexts/ |
| **Blockscreen** | DOCUMENTS_BUSINESS_RULES.md (раздел "2. Компонент") | src/components/ |
| **Interceptor** | DOCUMENTS_GATEKEEPER_INTEGRATION.md (раздел "Axios Interceptor") | src/api/ |
| **App.tsx** | DOCUMENTS_GATEKEEPER_INTEGRATION.md (раздел "App.tsx") | src/App.tsx |
| **Примеры API** | DOCUMENTS_GATEKEEPER_INTEGRATION.md (раздел "Примеры Запросов") | Для тестирования (Postman/curl) |

---

## 🚀 Команды для Быстрого Старта

```bash
# 1. Обновить Prisma schema + запустить миграцию
cd backend
npx prisma migrate dev --name add_documents_hard_blocker

# 2. Засеять базовые документы
npx prisma db seed

# 3. Перезагрузить backend
npm run start:dev

# 4. В другом терминале: запустить фронтенд
cd ..
npm run dev

# 5. Тестировать в браузере по сценариям выше
# http://localhost:5173
```

---

## 🎯 Финальный Чеклист

**Backend:**
- [ ] `backend/prisma/schema.prisma` обновлена с 5 новыми моделями
- [ ] Миграция запущена (`prisma migrate dev`)
- [ ] Seed запущен (`prisma db seed`) и документы появились в БД
- [ ] `GatekeeperMiddleware` создана `backend/src/common/middlewares/`
- [ ] `GatekeeperMiddleware` зарегистрирована в `AppModule`
- [ ] `DocumentRequestsController` создана
- [ ] Backend запускается без ошибок
- [ ] 403 ошибка возвращается при отсутствии документов

**Frontend:**
- [ ] `GatekeeperContext` создана
- [ ] `GatekeeperBlockscreen` компонент создан
- [ ] Axios interceptor настроен
- [ ] `App.tsx` обновлена с контекстом и проверками
- [ ] Frontend запускается без ошибок
- [ ] Экран блокировки отображается при 403

**Testing:**
- [ ] Сотрудник без документов → видит blockscreen
- [ ] После загрузки документа → блокировка снята
- [ ] Админ может создавать ордеры
- [ ] Сотрудник видит ордер как баннер
- [ ] Логирование работает (gatekeeper_logs наполняется)

---

## 💡 Лайфхаки

**Если что-то не работает:**

1. **Middleware не срабатывает:**
   - Проверить, что маршрут добавлен в `forRoutes()`
   - Проверить, что запрос идёт на защищённый маршрут
   - Проверить в DevTools → Network → Response Status 403

2. **GatekeeperBlockscreen не показывается:**
   - Проверить, что Axios interceptor зарегистрирован
   - Проверить Browser Console на ошибки
   - Проверить, что Context Provider обёрнут вокруг App

3. **Документ не существует в БД:**
   - Проверить, что seed запущен (`npx prisma db seed`)
   - Проверить `document_types` таблицу прямо в БД

4. **ООма → миграция не применилась:**
   - Проверить, что файл `schema.prisma` правильный
   - Удалить файл миграции и запустить снова:
   ```bash
   rm -rf prisma/migrations/[новый_номер]
   npx prisma migrate dev --name add_documents_hard_blocker
   ```

---

## 🏁 Итог

После 6-8 часов работы у тебя будет:

✅ **Hard Blocker System** (гейткипер)  
✅ **Обязательные документы** (is_mandatory)  
✅ **Ордеры от админа** (warrant system)  
✅ **Экран блокировки** (user-friendly UI)  
✅ **Audit logs** (полная история доступа)  

**Теперь сотрудник без медкнижки не сможет открыть смены. Точка.** 🔐

---

**Версия:** 1.0  
**Статус:** 🟢 Ready to Implement  
**Время:** 6-8 часов на одного разработчика  
**Сложность:** Средняя (NestJS + React middle level)

**Следующий шаг:** Открыть DOCUMENTS_BUSINESS_RULES.md и начать с Фазы 1! 🚀
