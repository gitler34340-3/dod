# 🔐 Hard Blocker: Бизнес-Логика Модуля Документы
## Гейткипер, Ордеры от Админа и Строгие Правила

**Версия:** 1.0  
**Дата:** 29.03.2026  
**Фокус:** Бизнес-правила, безопасность, middleware-защита

---

## 📋 Оглавление

1. [Ключевые Разделения](#ключевые-концепции)
2. [Таблицы БД с is_mandatory](#база-данных)
3. [Гейткипер: Hard Blocker](#гейткипер-hard-blocker)
4. [Система Ордеров (Requests/Warrants)](#система-ордеров)
5. [Middleware Защиты](#middleware-защиты)
6. [UI/UX Блокировки](#uiux-блокировки)
7. [Примеры Кода](#примеры-кода)

---

## 🎯 Ключевые Концепции

### Что такое Hard Blocker?

**Hard Blocker** — это жесткая защита на уровне приложения:

```
Сотрудник пытается открыть раздел (График, Смены, Зарплата)
                        ↓
Middleware проверяет обязательные документы
                        ↓
┌─────────────────────────────────┐
│ Есть все обязательные?           │
│ (паспорт + медкнижка + и т.д.)  │
└─────────────────────────────────┘
         ↙ ДА                  ↖ НЕТ
     ДОСТУП                  БЛОКИРОВКА
     Открывается            Экран заглушка
     нужный раздел          "Загрузи документ"
                            (Ничего больше нет)
```

### Три Статуса Документа

| Статус | Засчитается ли? | Блокирует ли доступ? |
|--------|---|---|
| **approved** (одобрен) | ✅ ДА | ❌ НЕТ |
| **pending** (на проверке) | ❌ НЕТ | ✅ ДА (БЛОКИРУЕТ!) |
| **rejected** (отклонён) | ❌ НЕТ | ✅ ДА (БЛОКИРУЕТ!) |
| **active** (действует) | ✅ ДА | ❌ НЕТ |
| **expired** (просрочен) | ❌ НЕТ | ✅ ДА (БЛОКИРУЕТ!) |

---

## 🗄️ База Данных

### 1. Таблица document_types (с is_mandatory)

```sql
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  
  -- ГЛАВНОЕ: обязательный ли документ?
  is_mandatory BOOLEAN DEFAULT false,  -- true = ГЕЙТКИПЕР!
  
  -- Как долго действует
  validity_days INT DEFAULT 365,
  
  -- Иконка и порядок
  icon_url VARCHAR(500),
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ВАЖНО: Сид базовых документов
INSERT INTO document_types (name, is_mandatory, validity_days) VALUES
  ('Паспорт', true, 3650),           -- 10 лет, ОБЯЗАТЕЛЬНО
  ('Медицинская книжка', true, 365), -- 1 год, ОБЯЗАТЕЛЬНО
  ('ДМС страховка', true, 365),      -- 1 год, ОБЯЗАТЕЛЬНО
  ('Договор труда', true, 1095),     -- 3 года, ОБЯЗАТЕЛЬНО
  ('Справка санитарная', true, 365), -- 1 год, ОБЯЗАТЕЛЬНО
  ('СНИЛС', true, 3650),             -- 10 лет, ОБЯЗАТЕЛЬНО
  ('ИНН', true, 3650),               -- 10 лет, ОБЯЗАТЕЛЬНО
  ('Справка от врача', false, 30),   -- Доп. справка, не обязательно
  ('Сертификат', false, 365);        -- Доп. сертификат, не обязательно
```

**Важно:** Документы с `is_mandatory=true` это **гейткиперы**. Если один из них отсутствует, в статусе `pending`, `rejected` или `expired` — **весь доступ заблокирован**.

---

### 2. Таблица employee_documents (основная)

```sql
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id VARCHAR(255) NOT NULL,
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  
  title VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000),
  file_size INT,
  mime_type VARCHAR(50),
  
  -- СТАТУСЫ: pending → approved → active → expired
  -- Или: pending → rejected (перезагрузить)
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'rejected', 'expired')),
  
  -- Дата выдачи и истечения
  issued_date TIMESTAMP,
  expiry_date TIMESTAMP,
  
  -- Админ проверил?
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),
  review_notes TEXT,
  
  -- Связь на ордер (запрос от админа)
  request_id UUID, -- Может быть NULL, если загружено сотрудником
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT uk_emp_doc UNIQUE(employee_id, document_type_id),
  CONSTRAINT fk_request_id FOREIGN KEY(request_id) REFERENCES document_requests(id) ON DELETE SET NULL
);

-- ИНДЕКСЫ для быстрого поиска (критично для middleware!)
CREATE INDEX idx_ed_employee ON employee_documents(employee_id);
CREATE INDEX idx_ed_status ON employee_documents(status);
CREATE INDEX idx_ed_mandatory ON employee_documents USING (
  SELECT id FROM employee_documents ed
  JOIN document_types dt ON ed.document_type_id = dt.id
  WHERE dt.is_mandatory = true AND ed.employee_id = $1
);
```

---

### 3. Таблица document_requests (Ордеры от Админа)

```sql
CREATE TABLE document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Кто требует?
  requested_by VARCHAR(255) NOT NULL, -- ID админа
  
  -- От кого требует?
  employee_id VARCHAR(255) NOT NULL,
  
  -- Какой документ?
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  
  -- Когда срок?
  deadline TIMESTAMP NOT NULL,
  
  -- Статус ордера
  -- pending = ждём загрузки
  -- submitted = сотрудник загрузил (на проверке)
  -- approved = админ одобрил
  -- rejected = админ отклонил
  -- completed = всё готово
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'completed')),
  
  -- Приоритет (текстовая телеграмма)
  priority VARCHAR(50) DEFAULT 'normal', -- high|normal|low
  
  message TEXT, -- Что написано в требовании?
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_req_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ИНДЕКСЫ
CREATE INDEX idx_req_employee ON document_requests(employee_id);
CREATE INDEX idx_req_status ON document_requests(status);
CREATE INDEX idx_req_deadline ON document_requests(deadline);
```

---

### 4. Таблица gatekeeper_logs (Для Аудита)

```sql
CREATE TABLE gatekeeper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  employee_id VARCHAR(255) NOT NULL,
  
  -- Что случилось?
  event_type VARCHAR(50), -- 'access_allowed'|'access_blocked'|'document_required'
  
  -- На какой раздел?
  resource VARCHAR(255), -- '/shifts', '/payroll', '/schedule' и т.д.
  
  -- Какой документ в блоке?
  blocked_by_document_id UUID,
  blocked_by_document_type VARCHAR(255), -- Имя типа
  blocked_by_status VARCHAR(50), -- pending|rejected|expired
  
  -- Когда?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gk_employee ON gatekeeper_logs(employee_id);
CREATE INDEX idx_gk_event ON gatekeeper_logs(event_type);
```

---

## 🔐 Гейткипер: Hard Blocker

### Алгоритм Проверки (Pseudocode)

```javascript
function checkGatekeeper(employeeId) {
  // 1. Получить все ОБЯЗАТЕЛЬНЫЕ типы документов
  mandatoryDocTypes = getDocumentTypes({ is_mandatory: true });
  
  // 2. Для каждого обязательного типа:
  for (docType of mandatoryDocTypes) {
    // 3. Получить документ сотрудника этого типа
    doc = getEmployeeDocument(employeeId, docType.id);
    
    // 4. Проверить статус
    if (!doc) {
      // Документ вообще не загружен → БЛОКИРОВКА
      return {
        allowed: false,
        blockedBy: docType.name,
        reason: 'MISSING'
      };
    }
    
    if (doc.status === 'pending') {
      // На проверке → БЛОКИРОВКА
      return {
        allowed: false,
        blockedBy: docType.name,
        reason: 'PENDING'
      };
    }
    
    if (doc.status === 'rejected') {
      // Отклонён → БЛОКИРОВКА (перезагрузить)
      return {
        allowed: false,
        blockedBy: docType.name,
        reason: 'REJECTED'
      };
    }
    
    if (doc.status === 'expired' || (doc.expiry_date && doc.expiry_date < NOW())) {
      // Просроченный → БЛОКИРОВКА
      return {
        allowed: false,
        blockedBy: docType.name,
        reason: 'EXPIRED',
        expiryDate: doc.expiry_date
      };
    }
    
    // Если статус 'approved' или 'active' → ОК
  }
  
  // 5. Если все обязательные есть и в статусе 'active'
  return {
    allowed: true,
    blockedBy: null,
    reason: null
  };
}
```

### SQL Query для Проверки

```sql
-- Получить БЛОКИРУЮЩИЕ документы сотрудника
SELECT 
  ed.id,
  ed.document_type_id,
  dt.name as document_name,
  ed.status,
  ed.expiry_date,
  CASE 
    WHEN ed.status = 'pending' THEN 'PENDING'
    WHEN ed.status = 'rejected' THEN 'REJECTED'
    WHEN ed.status = 'expired' THEN 'EXPIRED'
    WHEN ed.expiry_date < NOW() THEN 'EXPIRED'
    ELSE 'OK'
  END as blocker_status
FROM employee_documents ed
JOIN document_types dt ON ed.document_type_id = dt.id
WHERE 
  ed.employee_id = $1
  AND dt.is_mandatory = true
  AND (
    ed.status IN ('pending', 'rejected', 'expired')
    OR ed.expiry_date < NOW()
    OR ed.id IS NULL --Document missing entirely
  );

-- Если результат непуст → BLOCKER ACTIVE!
```

---

## 📨 Система Ордеров (Requests/Warrants)

### Ордер: Что Это?

**Ордер** (Request/Warrant) — это требование от администратора конкретному сотруднику загрузить конкретный документ до определённой даты.

**Сценарий:**
```
1. Админ видит, что у Ивана Петрова просроченная медкнижка
2. Админ кликает "Запросить документ" (Request Document)
3. Админ заполняет:
   - Сотрудник: Иван Петров
   - Документ: Медицинская книжка
   - Дедлайн: 31.03.2026
   - Сообщение: "СРОЧНО! Без этого в смены не возьму"
4. Иван видит КРАСНОЕ УВЕДОМЛЕНИЕ (как срочная телеграмма)
5. Иван загружает документ
6. Админ проверяет и одобряет
7. Ордер закрывается (status = 'completed')
```

### REST API: Создание Ордера

```http
POST /api/document-requests

Body:
{
  "employee_id": "emp-123",
  "document_type_id": "doc-type-medical",
  "deadline": "2026-03-31T23:59:59Z",
  "priority": "high",
  "message": "СРОЧНО! Без медкнижки в смены не возьму"
}

Response:
{
  "id": "req-456",
  "status": "pending",
  "created_at": "2026-03-29T10:30:00Z"
}

// Middleware: Проверить, что запрашивающий — админ
// Middleware: Проверить, что сотрудник существует
// Middleware: Проверить, что документ существует
// Middleware: Проверить, что дедлайн > NOW()
```

### Жизненный Цикл Ордера

```
┌─────────────────────────────────────────────────────────┐
│ Админ создаёт ордер                                    │
│ status = 'pending'                                      │
└────────────────────┬────────────────────────────────────┘
                     ↓
        ┌────────────────────────────┐
        │ Сотрудник загружает файл   │
        │ status = 'submitted'       │
        └────────┬───────────────────┘
                 ↓
    ┌────────────────────────────────┐
    │ Админ проверяет (verify scan)   │
    └────────┬──────────────┬─────────┘
             ↓              ↓
    ┌──────────────┐  ┌──────────────┐
    │ ОДОБРЕНО     │  │ ОТКЛОНЕНО    │
    │ status=ok    │  │ status=bad   │
    └──────┬───────┘  └──────┬───────┘
           │                 │
           │         Сотр. загружает заново
           │                 │
           └────────┬────────┘
                    ↓
        ┌────────────────────────┐
        │ status = 'completed'   │
        │ Ордер закрывается      │
        └────────────────────────┘
```

---

## 🛡️ Middleware Защиты

### 1. Gatekeeper Middleware (Node.js/NestJS)

```typescript
// Файл: backend/src/common/middlewares/gatekeeper.middleware.ts

import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GatekeeperMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Получить ID сотрудника из токена
    const employeeId = req.user?.employeeId;
    
    if (!employeeId) {
      // Не авторизован? Пропустить (auth middleware слово об этом скажет)
      return next();
    }

    // Защищённые маршруты (требуют обязательные документы)
    const protectedRoutes = [
      '/api/shifts',
      '/api/schedule',
      '/api/payroll',
      '/api/achievements',
      '/api/attendances',
      // Добавить остальные защищённые разделы
    ];

    const isProtectedRoute = protectedRoutes.some(route =>
      req.path.startsWith(route)
    );

    if (!isProtectedRoute) {
      // Не защищённый маршрут → пропустить
      return next();
    }

    // ✅ ГЛАВНОЕ МЕСТО: Проверить гейткипер
    try {
      const blockersResult = await this.checkMandatoryDocuments(employeeId);

      if (!blockersResult.allowed) {
        // БЛОКИРОВКА!
        req.gatekeeper = {
          blocked: true,
          reason: blockersResult.reason,
          documentName: blockersResult.blockedBy,
          documentId: blockersResult.blockedDocumentId,
        };

        // Логировать блокировку
        await this.prisma.gatekeeperLog.create({
          data: {
            employee_id: employeeId,
            event_type: 'access_blocked',
            resource: req.path,
            blocked_by_document_id: blockersResult.blockedDocumentId,
            blocked_by_document_type: blockersResult.blockedBy,
            blocked_by_status: blockersResult.reason,
          },
        });

        // Вернуть специальный ответ (фронтенд поймёт и покажет экран блокировки)
        return res.status(403).json({
          error: 'GATEKEEPER_BLOCKED',
          message: `Требуется документ: ${blockersResult.blockedBy}`,
          details: {
            blocked: true,
            documentType: blockersResult.blockedBy,
            reason: blockersResult.reason, // 'MISSING' | 'PENDING' | 'REJECTED' | 'EXPIRED'
          },
        });
      }

      // ✅ Всё в порядке → идти дальше
      req.gatekeeper = { blocked: false };
      next();
    } catch (error) {
      console.error('Gatekeeper error:', error);
      // В случае ошибки — блокировать для безопасности
      return res.status(500).json({
        error: 'GATEKEEPER_ERROR',
        message: 'Ошибка проверки документов',
      });
    }
  }

  // Приватный метод: проверить все обязательные документы
  private async checkMandatoryDocuments(employeeId: string) {
    // Получить все ОБЯЗАТЕЛЬНЫЕ типы
    const mandatoryTypes = await this.prisma.documentType.findMany({
      where: { is_mandatory: true },
    });

    // Для каждого типа проверить документ сотрудника
    for (const docType of mandatoryTypes) {
      const doc = await this.prisma.employeeDocument.findFirst({
        where: {
          employee_id: employeeId,
          document_type_id: docType.id,
        },
      });

      // Если документа нет вообще
      if (!doc) {
        return {
          allowed: false,
          reason: 'MISSING',
          blockedBy: docType.name,
          blockedDocumentId: null,
        };
      }

      // Если статус не 'active' или 'approved'
      if (!['active', 'approved'].includes(doc.status)) {
        return {
          allowed: false,
          reason: this.mapStatusToReason(doc.status),
          blockedBy: docType.name,
          blockedDocumentId: doc.id,
        };
      }

      // Если истёк срок
      if (doc.expiry_date && doc.expiry_date < new Date()) {
        return {
          allowed: false,
          reason: 'EXPIRED',
          blockedBy: docType.name,
          blockedDocumentId: doc.id,
        };
      }
    }

    // Все обязательные документы в порядке
    return {
      allowed: true,
      reason: null,
      blockedBy: null,
      blockedDocumentId: null,
    };
  }

  private mapStatusToReason(status: string): string {
    const map = {
      'pending': 'PENDING',
      'rejected': 'REJECTED',
      'expired': 'EXPIRED',
      'draft': 'PENDING',
    };
    return map[status] || 'UNKNOWN';
  }
}
```

### 2. Регистрация Middleware в App Module

```typescript
// backend/src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { GatekeeperMiddleware } from './common/middlewares/gatekeeper.middleware';

@Module({
  imports: [/* ... */],
  controllers: [/* ... */],
  providers: [/* ... */],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GatekeeperMiddleware)
      .forRoutes(
        'shifts',
        'schedule',
        'payroll',
        'achievements',
        'attendances',
        // Остальные защищённые маршруты
      );
  }
}
```

---

## 📲 UI/UX Блокировки

### 1. Экран Блокировки (Full Screen)

Когда sотрудник видит ошибку 403 с `GATEKEEPER_BLOCKED`:

**Визуальный Дизайн (ASCII):**

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║                  🔐 ДОСТУП ОГРАНИЧЕН 🔐                  ║
║                                                            ║
║         ╔══════════════════════════════════════════╗       ║
║         ║   Деревянный фон (wood-800)              ║       ║
║         ║   С текстурой дерева                     ║       ║
║         ║                                          ║       ║
║         ║   Крупный текст (serif):                 ║       ║
║         ║   "ТРЕБУЕТСЯ ДОКУМЕНТ"                   ║       ║
║         ║                                          ║       ║
║         ║   📋 Медицинская книжка                  ║       ║
║         ║                                          ║       ║
║         ║   Подтекст (smaller):                    ║       ║
║         ║   "Без этого документа вы не можете      ║       ║
║         ║    пользоваться приложением"             ║       ║
║         ║                                          ║       ║
║         ║   [🔄 Загрузить документ] (orange btn)   ║       ║
║         ║                                          ║       ║
║         └──────────────────────────────────────────┘       ║
║                                                            ║
║                  (Больше ничего нет!)                    ║
║         (No sidebar, no navigation, no other buttons)    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

**Tailwind CSS:**

```tsx
<div className="
  fixed inset-0 
  flex items-center justify-center
  bg-wood-800 bg-wood-texture
  z-50
">
  <div className="
    bg-parchment-200 bg-paper-texture
    p-8 rounded-lg
    max-w-md
    text-center
    border-4 border-wood-800
    shadow-xl
  ">
    <div className="text-6xl mb-4">🔐</div>
    
    <h1 className="
      text-3xl font-serif font-black
      text-ink-900 mb-4
    ">
      ДОСТУП ОГРАНИЧЕН
    </h1>
    
    <div className="
      text-5xl mb-6
      opacity-75
    ">
      📋
    </div>
    
    <p className="
      text-xl font-serif
      text-ink-900 mb-2
    ">
      Требуется: <span className="font-bold">Медицинская книжка</span>
    </p>
    
    <p className="
      text-sm text-ink-600 mb-6
      font-serif italic
    ">
      Без этого документа вы не можете пользоваться приложением.
      Загрузите скан документа.
    </p>
    
    <button className="
      w-full
      bg-dodo-600 text-white
      px-6 py-3 rounded-lg
      font-bold text-lg
      hover:bg-dodo-700
      active:scale-95
      transition-all duration-200
      border-2 border-dodo-800
    ">
      🔄 Загрузить документ
    </button>
    
    <p className="
      text-xs text-ink-500 mt-4
      font-mono
    ">
      Максимум 10 МБ, PDF/JPG/PNG
    </p>
  </div>
</div>
```

### 2. Компонент GatekeeperBlockscreen

```tsx
// components/GatekeeperBlockscreen.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface GatekeeperBlockscreenProps {
  documentName: string;
  reason: 'MISSING' | 'PENDING' | 'REJECTED' | 'EXPIRED';
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export const GatekeeperBlockscreen: React.FC<GatekeeperBlockscreenProps> = ({
  documentName,
  reason,
  onUpload,
  isUploading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const reasonTexts = {
    MISSING: 'Документ отсутствует',
    PENDING: 'Документ на проверке',
    REJECTED: 'Документ отклонён, загрузите новый',
    EXPIRED: 'Документ просрочен',
  };

  const reasonEmoji = {
    MISSING: '❌',
    PENDING: '⏳',
    REJECTED: '✗',
    EXPIRED: '⚠',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="
        fixed inset-0
        flex items-center justify-center
        bg-wood-800 bg-wood-texture
        z-50
        p-4
      "
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="
          bg-parchment-200 bg-paper-texture
          p-8 rounded-xl
          max-w-md w-full
          text-center
          border-4 border-wood-800 border-double
          shadow-saloon-dark
        "
      >
        {/* Иконка замка */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-7xl mb-6"
        >
          🔐
        </motion.div>

        {/* Заголовок */}
        <h1 className="
          text-3xl font-serif font-black
          text-ink-900 mb-4
          text-shadow-saloon
        ">
          ДОСТУП ОГРАНИЧЕН
        </h1>

        {/* Иконка документа */}
        <div className="text-6xl mb-4 opacity-80">📋</div>

        {/* Название документа */}
        <p className="
          text-2xl font-serif font-bold
          text-ink-900 mb-2
        ">
          {documentName}
        </p>

        {/* Статус документа */}
        <div className="
          inline-flex items-center gap-2
          bg-parchment-300 px-4 py-2 rounded-lg
          mb-6
        ">
          <span className="text-xl">{reasonEmoji[reason]}</span>
          <span className="text-sm font-bold text-ink-800">
            {reasonTexts[reason]}
          </span>
        </div>

        {/* Основное сообщение */}
        <p className="
          text-sm text-ink-700 mb-8
          font-serif leading-relaxed
          bg-parchment-100 p-4 rounded-lg
        ">
          Без этого документа вы не можете пользоваться другими разделами приложения.
          Пожалуйста, загрузите скан документа, и администратор проверит его.
        </p>

        {/* Загрузка файла */}
        <label className="
          block
          border-2 border-dashed border-ink-400
          rounded-lg p-6
          cursor-pointer
          bg-parchment-100
          hover:bg-dodo-50
          transition-colors
          mb-6
        ">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              if (e.target.files?.length) {
                setSelectedFile(e.target.files[0]);
              }
            }}
            className="hidden"
            disabled={isUploading}
          />
          <div className="text-center">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-sm font-bold text-ink-900">
              {selectedFile ? selectedFile.name : 'Выбери файл'}
            </p>
            <p className="text-xs text-ink-500 mt-1">
              PDF, JPG, PNG до 10 МБ
            </p>
          </div>
        </label>

        {/* Кнопка загрузки */}
        <button
          onClick={() => selectedFile && onUpload(selectedFile)}
          disabled={!selectedFile || isUploading}
          className="
            w-full
            bg-dodo-600 text-white
            px-6 py-4 rounded-lg
            font-bold text-lg font-serif
            hover:bg-dodo-700
            disabled:opacity-50 disabled:cursor-not-allowed
            active:scale-95
            transition-all duration-200
            border-2 border-dodo-800
          "
        >
          {isUploading ? (
            <>⏳ Загружается...</>
          ) : (
            <>🔄 Загрузить документ</>
          )}
        </button>

        <p className="
          text-xs text-ink-500 mt-4
          font-mono
        ">
          После загрузки администратор проверит документ
          обычно в течение 24 часов.
        </p>
      </motion.div>
    </motion.div>
  );
};
```

### 3. Срочная Телеграмма (Request Notification)

Когда админ отправляет ордер, сотрудник видит **срочное уведомление**:

```tsx
// components/DocumentRequestBanner.tsx

import React from 'react';
import { motion } from 'framer-motion';

interface DocumentRequestBannerProps {
  documentName: string;
  deadline: Date;
  message: string;
  priority: 'high' | 'normal' | 'low';
  onOpen: () => void;
}

export const DocumentRequestBanner: React.FC<DocumentRequestBannerProps> = ({
  documentName,
  deadline,
  message,
  priority,
  onOpen,
}) => {
  const priorityStyles = {
    high: {
      bg: 'bg-status-reject',
      border: 'border-status-reject',
      icon: '🚨',
    },
    normal: {
      bg: 'bg-warning',
      border: 'border-warning',
      icon: '⚠',
    },
    low: {
      bg: 'bg-pending',
      border: 'border-pending',
      icon: 'ℹ',
    },
  };

  const style = priorityStyles[priority];

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`
        fixed top-0 left-0 right-0
        z-40
        ${style.bg}
        border-b-4 ${style.border}
        p-4
        shadow-lg
      `}
    >
      <div className="container mx-auto">
        <div className="flex items-center gap-4">
          {/* Иконка */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-2xl"
          >
            {style.icon}
          </motion.div>

          {/* Текст сообщения */}
          <div className="flex-1">
            <p className="font-black text-white">
              ТРЕБУЕТСЯ: {documentName}
            </p>
            <p className="text-sm text-white opacity-90 mt-1">
              {message}
            </p>
            <p className="text-xs text-white opacity-75 mt-2">
              ⏰ Дедлайн: {deadline.toLocaleDateString('ru-RU')}
            </p>
          </div>

          {/* Кнопка */}
          <button
            onClick={onOpen}
            className="
              px-4 py-2 rounded-lg
              bg-white text-ink-900
              font-bold
              hover:bg-parchment-200
              active:scale-95
              transition-all
            "
          >
            📤 Загрузить
          </button>

          {/* Закрыть */}
          <button className="text-white hover:opacity-70">
            ✕
          </button>
        </div>
      </div>
    </motion.div>
  );
};
```

---

## 💻 Примеры Кода

### 1. React: Проверка Гейткипера в App.tsx

```tsx
// src/App.tsx

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GatekeeperBlockscreen } from './components/GatekeeperBlockscreen';

function App() {
  const [gatekeeperStatus, setGatekeeperStatus] = useState<{
    blocked: boolean;
    documentName?: string;
    documentId?: string;
    reason?: string;
  }>({ blocked: false });

  // Перехват 403 ошибок
  useEffect(() => {
    const handleFetch = async (url: string) => {
      try {
        const res = await fetch(url);
        
        if (res.status === 403) {
          const data = await res.json();
          
          if (data.error === 'GATEKEEPER_BLOCKED') {
            // Показать экран блокировки
            setGatekeeperStatus({
              blocked: true,
              documentName: data.details.documentType,
              reason: data.details.reason,
            });
            return;
          }
        }
        
        setGatekeeperStatus({ blocked: false });
      } catch (error) {
        console.error('Error:', error);
      }
    };

    // Перехватывать все запросы protected routes
    // Это можно сделать через axios interceptor
  }, []);

  if (gatekeeperStatus.blocked) {
    return (
      <GatekeeperBlockscreen
        documentName={gatekeeperStatus.documentName || 'Документ'}
        reason={gatekeeperStatus.reason as 'MISSING' | 'PENDING' | 'REJECTED' | 'EXPIRED'}
        onUpload={async (file) => {
          // Загрузить файл
          const formData = new FormData();
          formData.append('file', file);
          
          const res = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (res.ok) {
            // Перезагрузить страницу
            window.location.reload();
          }
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Остальные маршруты */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 2. Axios Interceptor для Гейткипера

```typescript
// src/api/axiosInstance.ts

import axios from 'axios';
import { useGatekeeper } from '../hooks/useGatekeeper';

export const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: '/api',
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403) {
        const data = error.response.data;
        
        if (data.error === 'GATEKEEPER_BLOCKED') {
          // Отправить сигнал в Redux / Context / Zustand
          // чтобы показать экран блокировки
          
          window.dispatchEvent(
            new CustomEvent('gatekeeper:blocked', {
              detail: {
                documentName: data.details.documentType,
                reason: data.details.reason,
              },
            })
          );
          
          return Promise.reject(error);
        }
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};
```

### 3. Контроллер для Создания Ордера (NestJS)

```typescript
// backend/src/document-requests/document-requests.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { DocumentRequestsService } from './document-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('document-requests')
@UseGuards(JwtAuthGuard)
export class DocumentRequestsController {
  constructor(private service: DocumentRequestsService) {}

  /**
   * POST /document-requests
   * Админ создаёт ордер (требует документ у сотрудника)
   */
  @Post()
  @UseGuards(AdminGuard) // Только админ!
  async create(
    @Body()
    dto: {
      employee_id: string;
      document_type_id: string;
      deadline: string; // ISO 8601
      priority?: 'high' | 'normal' | 'low';
      message?: string;
    },
    @Req() req: any,
  ) {
    const adminId = req.user.id;

    // Валидация дедлайна
    const deadline = new Date(dto.deadline);
    if (deadline <= new Date()) {
      throw new Error('Дедлайн должен быть в будущем');
    }

    return this.service.createRequest({
      requested_by: adminId,
      employee_id: dto.employee_id,
      document_type_id: dto.document_type_id,
      deadline,
      priority: dto.priority || 'normal',
      message: dto.message,
    });
  }

  /**
   * GET /document-requests/my
   * Сотрудник видит свои ордеры
   */
  @Get('my')
  async getMyRequests(@Req() req: any) {
    const employeeId = req.user.employeeId;
    return this.service.getRequestsByEmployee(employeeId);
  }

  /**
   * PATCH /document-requests/:id/status
   * Меняет статус ордера
   */
  @Patch(':id/status')
  @UseGuards(AdminGuard)
  async updateStatus(
    @Param('id') requestId: string,
    @Body('status') status: 'approved' | 'rejected' | 'completed',
  ) {
    return this.service.updateRequestStatus(requestId, status);
  }
}
```

---

## 📊 Алгоритм проверки (Графически)

```
HTTP Request поступает
         ↓
├─ Это protected route? (shifts, payroll, schedule...)
│  ├─ НЕТ → пропустить gatekeeper
│  └─ ДА → продолжить
│
├─ Пользователь авторизован?
│  ├─ НЕТ → auth error
│  └─ ДА → продолжить
│
├─ Получить список ОБЯЗАТЕЛЬНЫХ документов (is_mandatory=true)
│  └─ Для каждого:
│     ├─ Есть ли у сотрудника?
│     │  ├─ НЕТ → БЛОКИРОВКА (MISSING)
│     │  └─ ДА → продолжить
│     │
│     ├─ Статус = 'active' или 'approved'?
│     │  ├─ НЕТ → БЛОКИРОВКА (PENDING/REJECTED/DRAFT)
│     │  └─ ДА → продолжить
│     │
│     └─ expiry_date < NOW()?
│        ├─ ДА → БЛОКИРОВКА (EXPIRED)
│        └─ НЕТ → ОК
│
└─ Все обязательные в порядке?
   ├─ ДА → пропустить (next())
   └─ НЕТ → res.status(403) + GATEKEEPER_BLOCKED
```

---

## 🎯 Чеклист: Реализация Гейткипера

- [ ] Таблица `document_types` с полем `is_mandatory`
- [ ] Таблица `employee_documents` с полем `status` и `expiry_date`
- [ ] Таблица `document_requests` для ордеров от админа
- [ ] Таблица `gatekeeper_logs` для аудита доступа
- [ ] SQL индексы на `is_mandatory`, `status`, `expiry_date`, `employee_id`
- [ ] Prisma schema обновлена для всех таблиц
- [ ] GatekeeperMiddleware написана (NestJS)
- [ ] Middleware зарегистрирована в AppModule
- [ ] GatekeeperBlockscreen компонент (React)
- [ ] DocumentRequestBanner компонент (React)
- [ ] Axios interceptor для 403 ошибок
- [ ] REST endpoint POST /document-requests (админ создаёт ордер)
- [ ] REST endpoint PATCH /documents/:id/status (админ обновляет)
- [ ] Фронтенд показывает экран блокировки при 403
- [ ] Протестировано: загрузить документ → блокировка снята
- [ ] Протестировано: админ отправляет ордер → сотрудник видит баннер

---

## 🚨 Hard Blocker: Summary

| На что влияет | Как реализуется |
|------|---------|
| **Full App Block** | Middleware перехватывает, 403 ответ |
| **Protected Routes** | `/shifts`, `/payroll`, `/schedule` и т.д. |
| **Обязательные Docs** | `document_types.is_mandatory = true` |
| **Статус Docов** | Только `active` и `approved` позволяют доступ |
| **Экран Блокировки** | React компонент GatekeeperBlockscreen (full screen) |
| **Ордеры от Админа** | Таблица document_requests + notification banner |
| **Логирование** | gatekeeper_logs для аудита |

---

**Версия:** 1.0  
**Статус:** 🟡 In Development (требует имплементации)  
**Критичность:** 🔴 КРИТИЧНАЯ ФИШКА

Это то, что превращает обычный модуль в **боевую систему защиты**.
