# ⚡ 5-Минутный Quick Start: Модуль Документы
## Начни писать код прямо сейчас

---

## 🎯 В Чём Суть?

**Модуль "Документы"** для HR-системы пиццерии (типа Dodo IS).

- **Сотрудник**: загружает медкнижку, договор, страховку
- **Админ**: проверяет, одобряет, видит кто с просроченными документами
- **Система**: блокирует смены сотрудников с истекшими документами

**Визуальный стиль**: Dodo Pizza (оранжевый, скорость) + Red Dead Redemption 2 (пергамент, печати, деревянные доски) = "Цифровой салун" 🤠

---

## 📦 Что Ты Получаешь

### ✅ 4 Готовых Документа Markdown

1. **DOCUMENTS_README.md** ← Ты сейчас здесь
2. **DOCUMENTS_MODULE_TECHNICAL_GUIDE.md** — полный гайдлайн (200+ строк)
3. **DOCUMENTS_QUICK_START.md** — copy-paste примеры (180+ строк)
4. **DOCUMENTS_VISUAL_SUMMARY.md** — UI примеры и диаграммы (150+ строк)

### ✅ Всё Что Нужно для Кодирования

- ✓ SQL миграции (PostgreSQL и SQLite)
- ✓ Prisma schema
- ✓ NestJS controller + service
- ✓ React компоненты (DocumentCard, DocumentUploadZone, AdminDashboard)
- ✓ Tailwind config (полная палитра Dodo + RDR2)
- ✓ CSS анимации (stamp-hit, ember-pulse, page-flip, burn-effect)
- ✓ React hooks (useDocumentUpload)
- ✓ Примеры интеграции
- ✓ Чеклист для QA

---

## 🚀 Быстрый Старт (30 минут)

### Шаг 1: Подготовка БД (5 минут)

Открой **DOCUMENTS_QUICK_START.md** → раздел "SQL: Быстрое Создание"

Скопируй SQL для твоей БД:
- **PostgreSQL**? Используй первый скрипт
- **SQLite**? Используй второй скрипт

Выполни:
```bash
# PostgreSQL
psql -U postgres < migration.sql

# SQLite (в приложении)
npm run prisma:migrate
```

✅ Готово. Таблицы созданы.

---

### Шаг 2: Backend API (10 минут)

Открой **DOCUMENTS_QUICK_START.md** → раздел "NestJS Controller: API Endpoints"

1. Скопируй код контроллера
2. Вставь в `backend/src/documents/documents.controller.ts`
3. Скопируй сервис из **DOCUMENTS_MODULE_TECHNICAL_GUIDE.md**
4. Вставь в `backend/src/documents/documents.service.ts`

Обнови `app.module.ts`:
```typescript
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [DocumentsModule, /* ... */],
})
export class AppModule {}
```

Запусти:
```bash
npm run dev:backend
```

✅ API готов. Endpoints доступны по `/api/documents/`

---

### Шаг 3: Frontend Components (10 минут)

Открой **DOCUMENTS_QUICK_START.md** → разделы React компонентов

1. Скопируй Tailwind config:
   ```bash
   cp tailwind.config.ts src/
   npm run dev  # Перезагрузи, чтоб Tailwind пересоздалась
   ```

2. Скопируй компоненты:
   - DocumentCard.tsx → `src/components/documents/`
   - DocumentUploadZone.tsx → `src/components/documents/`

3. Скопируй CSS:
   - animations.css → `src/styles/`

4. Скопируй hook:
   - useDocumentUpload.ts → `src/hooks/`

5. Создай страницу [MyDocumentsPage.tsx](src/pages/MyDocumentsPage.tsx):
   ```tsx
   import { DocumentCard } from '@/components/documents/DocumentCard';
   
   export default function MyDocumentsPage() {
     // Используй примеры из DOCUMENTS_VISUAL_SUMMARY.md
   }
   ```

✅ Frontend готов. Открой `http://localhost:5173`

---

## 🎨 Цветовая Палитра (Используй Эти HEX)

```css
/* Dodo Orange (Primary) */
--dodo-primary: #FF6B35;      /* Кнопки, акценты */
--dodo-light: #FFB380;         /* Hover состояния */
--dodo-dark: #D94620;          /* Active, shadows */

/* Пергамент (Background) */
--parchment-page: #F5E6D3;     /* Основной фон */
--parchment-card: #E8D7C3;     /* Карточки */
--parchment-border: #D4C4B0;   /* Разделители */

/* Дерево (Frames) */
--wood-dark: #4A3728;          /* Доски, бордеры */
--wood-light: #6B5344;         /* Акценты */

/* Статусы */
--status-approve: #2D5016;     /* Зеленый */
--status-pending: #C79C3F;     /* Золотой */
--status-reject: #8B0000;      /* Красный */
--status-expired: #D4522D;     /* Оранжево-ржавый */
```

Все цвета готовы в `tailwind.config.ts`. Просто используй Tailwind классы:
```tsx
<div className="bg-parchment-200 border-2 border-wood-800">
  <button className="bg-dodo-600 hover:bg-dodo-700">Одобрить</button>
</div>
```

---

## 🎬 Ключевые Анимации

**4 эффекта, которые делают UI живым:**

### 1. **STAMP HIT** (Удар штампа при approve)
```css
.stamp-hit {
  animation: stampHit 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  /* Штамп прилетает с ротацией, останавливается на бумаге */
}
```
**Использование:**
```tsx
<button 
  onClick={() => {
    approveDocument(docId);
    element.classList.add('stamp-hit');
    playSound('stamp.mp3');
  }}
>
  ✓ ПРИНЯТО
</button>
```

### 2. **EMBER PULSE** (Пульсация при drag-over)
На дропзоне при перетаскивании файла:
```css
.upload-zone.drag-over {
  animation: emberGlow 2s ease-in-out infinite;
}
/* Фон светится оранжевым, как угли костра */
```

### 3. **PAGE FLIP** (Перелистывание вкладок)
```css
.tab-content {
  animation: pageFlip 0.4s cubic-bezier(...) forwards;
  /* Как тяжелая страница, которая медленно кладется на стол */
}
```

### 4. **BURN EFFECT** (Выжог штампа)
После approve карточка "выжигается":
```css
.burn-stamp {
  animation: burnEffect 1s ease-out;
  /* Бумага темнеет от жара, потом светлеет */
}
```

**Все готовы в animations.css**. Просто скопируй и используй классы.

---

## 📊 Структура БД За 30 Секунд

```
employee_documents (основная таблица)
├─ id (primary key)
├─ employee_id + document_type_id (уникальная пара)
├─ status (pending|approved|active|rejected|expired)
├─ file_url (скан)
├─ expiry_date (когда истекает)
├─ reviewed_by (админ, который проверил)
└─ reviewed_at (когда проверил)

document_logs (история действий)
├─ document_id
├─ action (uploaded|approved|rejected)
├─ actor_id (кто сделал)
└─ old_status → new_status

Остальное (индексы, констрейнты) готовы в SQL скриптах
```

**Главное:** при `status = 'expired'` система блокирует добавление сотрудника в смену.

---

## 🔗 API Endpoints (Используй Сразу)

```bash
# Upload документа (сотрудник)
POST /api/documents/upload/:employeeId/:documentTypeId
  Body: multipart/form-data { file }
  Response: { id, status: "pending", ... }

# Получить мои документы (сотрудник)
GET /api/documents/my
  Response: [ { id, title, status, expiryDate, ... }, ... ]

# Получить на проверку (админ)
GET /api/documents/pending?limit=50
  Response: [ { id, employeeId, title, fileUrl, ... }, ... ]

# Одобрить (админ)
PATCH /api/documents/:documentId/approve
  Body: { notes?: string }
  Response: { status: "active", expiryDate, ... }

# Отклонить (админ)
PATCH /api/documents/:documentId/reject
  Body: { reason: string }
  Response: { status: "rejected", reviewNotes: reason }

# Получить просроченные (админ, для WANTED)
GET /api/documents/expired
  Response: [ { id, employeeId, documentType, ... }, ... ]
```

**Все endpoints готовы в NestJS Controller из QUICK_START.md**

---

## 🧪 Быстрый Тест (5 минут)

### Сотрудник
1. Открой страницу "Мои документы"
2. Перетащи PDF на дропзону
3. Убедись, что файл загружается
4. Статус документа должна быть "⏳ На проверке"

### Админ
1. Открой "Амбарная книга"
2. Нажми на документ в списке
3. Нажми "✓ ПРИНЯТО"
4. Убедись, что:
   - Анимация stamp-hit сработала
   - Статус изменился на "★ Действительно"
   - Документ исчез из вкладки "Pending"

---

## 🚨 Ошибки, Которые Легко Допустить

### ❌ "Компоненты не загружаются"
✅ Проверь:
- Tailwind config скопирован в проект?
- Запустил `npm run dev`?
- Все классы используют `className`, не `style`?

### ❌ "SQL говорит ошибку constraint"
✅ Проверь:
- Все 4 таблицы созданы?
- Индексы добавлены?
- Не конфликтует с существующими таблицами?

### ❌ "Анимации работают слишком быстро/медленно"
✅ Измени duration в CSS:
```css
animation: stampHit 1.0s /* было 0.6s */
```

### ❌ "Звуки не воспроизводятся"
✅ Проверь:
- Браузер разрешил audio?
- Файлы звуков в public/sounds/?
- Используешь audioManager из utils?

---

## 📱 Мобильные Версии

Все компоненты уже responsive благодаря Tailwind.

Дополнительно проверь на мобильном:
- [ ] DocumentCard нормально выглядит (достаточно места для кнопок)
- [ ] DocumentUploadZone нормально работает (touch drag-n-drop)
- [ ] AdminDashboard на маленьком экране (может скрыть левую панель)

**Нет времени?** Мобильную версию можно сделать на следующую итерацию.

---

## 🎓 Дальше Читать

После успешного запуска прочитай полные документы:

1. **DOCUMENTS_MODULE_TECHNICAL_GUIDE.md** — если хочешь понять **почему** так
2. **DOCUMENTS_VISUAL_SUMMARY.md** — если хочешь показать дизайн stakeholders
3. **DOCUMENTS_QUICK_START.md** — если нужны дополнительные примеры

---

## ✅ Финальный Чеклист перед Коммитом

- [ ] SQL миграция выполнена
- [ ] Prisma генерирует без ошибок
- [ ] Backend API тестирует (хотя бы в Postman)
- [ ] Frontend компоненты отображаются
- [ ] Tailwind цвета применяются
- [ ] Анимации работают
- [ ] File upload работает
- [ ] Approve/Reject buttons работают
- [ ] Статусы обновляются в UI

---

## 🚀 Ты Готов!

**Все что нужно:**
- ✅ SQL скрипты — в QUICK_START.md
- ✅ Backend код — в QUICK_START.md и GUIDE.md
- ✅ Frontend компоненты — в QUICK_START.md
- ✅ Стили и анимации — в QUICK_START.md
- ✅ Примеры использования — в VISUAL_SUMMARY.md
- ✅ Архитектура — в GUIDE.md
- ✅ Навигация — в документе сверху (DOCUMENTS_README.md)

**Дальше — просто код. Начни с Шага 1 (БД), потом Шаг 2 (API), потом Шаг 3 (UI).**

---

**Версия:** 1.0  
**Время чтения:** 5 минут ⏱️  
**Время реализации:** 1-2 дня 📅  
**Статус:** Production Ready 🟢  

---

## 🎯 Финальное Слово

Этот модуль не просто функциональность — это **опыт**. Каждая карточка на доске, каждый удар штампа, каждый цвет пергамента, каждая анимация — создают ощущение работы в "Цифровом салуне", где технология встречается с историей Дикого Запада.

**Время начинать. Удачи! 🤠🚀**
