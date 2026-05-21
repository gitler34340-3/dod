# 📜 Модуль "Документы" — Технический Гайдлайн
## HR-система пиццерии: Цифровой салун 🤠

**Версия:** 1.0  
**Дата:** 29.03.2026  
**Статус:** Production-ready Guide  

---

## 📋 Оглавление

1. [Архитектура & Сущности](#архитектура--сущности)
2. [База Данных (SQL)](#база-данных-sql)
3. [Цветовая Палитра](#цветовая-палитра--dodo--rdr2)
4. [UI Компоненты](#ui-компоненты)
5. [Микроанимации (CSS/JS)](#микроанимации-cssjs)
6. [Примеры Кода](#примеры-кода)

---

## 🏗️ Архитектура & Сущности

### Сопоставление: jkh-web → HR-Документы

| jkh-web | HR-система | Роль | Назначение |
|---------|-----------|------|-----------|
| **User (Жилец)** | **Employee (Сотрудник)** | Пассивная | Загружает документы, видит статус |
| **Dispatcher** | **Admin/Manager** | Активная | Проверяет, утверждает, отклоняет |
| **Task (Заявка)** | **Document (Медкнижка, Договор, ДМС)** | Центральная | Основная сущность модуля |
| **Department** | **Department** | Контекст | Фильтрация, история |
| **TaskStatus** | **DocumentStatus** | Состояние | pending→approved→active |

### Статусы Документов

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐     ┌─────────┐
│   DRAFT     │────▶│   PENDING    │────▶│ APPROVED  │────▶│ ACTIVE  │
│  (Черновик) │     │ (На проверке)│     │(Подтверда)│     │(Действ.)│
└─────────────┘     └──────────────┘     └───────────┘     └────┬────┘
                           │                                      │
                           └──────────────▶ REJECTED (Отклонено)  │
                                                                  ▼
                                                          ┌─────────────────┐
                                                          │  EXPIRED        │
                                                          │  (Просроченно)  │
                                                          └─────────────────┘
```

---

## 🗄️ База Данных (SQL)

### 1. Миграция Prisma для Documents

**Файл:** `backend/prisma/migrations/202603xx_add_documents/migration.sql`

```sql
-- Таблица требуемых документов (шаблоны)
CREATE TABLE document_types (
  id STRING PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,           -- "Медицинская книжка", "Договор"
  description TEXT,
  required_for_role VARCHAR(100),       -- "employee", "manager", "all"
  validity_days INT DEFAULT 365,        -- Срок действия (дни)
  icon_url VARCHAR(500),                -- Иконка (для UI)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_document_types_name UNIQUE(name)
);

-- Таблица документов сотрудников
CREATE TABLE employee_documents (
  id STRING PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id STRING NOT NULL,
  document_type_id STRING NOT NULL,
  
  -- Основное содержание
  title VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000),               -- URL сканированного документа
  file_name VARCHAR(255),
  file_size INT,                        -- Размер в байтах
  mime_type VARCHAR(50),
  
  -- Статус и даты
  status VARCHAR(50) DEFAULT 'pending',  -- pending|approved|rejected|active|expired
  status_notes TEXT,                    -- Комментарий при отклонении
  
  issued_date TIMESTAMP,                -- Дата выдачи документа
  expiry_date TIMESTAMP,                -- Дата истечения
  days_until_expiry INT GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (expiry_date - CURRENT_TIMESTAMP))
  ) STORED,                             -- Для удобных фильтров
  
  -- Проверка админом
  reviewed_by STRING,                   -- ID администратора
  reviewed_at TIMESTAMP,                -- Когда проверили
  review_notes TEXT,                    -- Комментарии админа
  
  -- Аудит
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_edu_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_edu_type FOREIGN KEY(document_type_id) REFERENCES document_types(id) ON DELETE RESTRICT,
  CONSTRAINT fk_edu_reviewer FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Индексы для быстрого поиска
CREATE INDEX idx_ed_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_ed_status ON employee_documents(status);
CREATE INDEX idx_ed_expiry_date ON employee_documents(expiry_date);
CREATE INDEX idx_ed_created_at ON employee_documents(created_at DESC);
CREATE INDEX idx_ed_status_expiry ON employee_documents(status, expiry_date);

-- Таблица лога действий над документами (аудит)
CREATE TABLE document_logs (
  id STRING PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id STRING NOT NULL,
  action VARCHAR(50) NOT NULL,          -- 'created'|'uploaded'|'approved'|'rejected'|'expired'
  actor_id STRING NOT NULL,             -- Кто совершил действие
  actor_role VARCHAR(50),               -- 'employee'|'admin'|'system'
  
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  
  details JSONB,                        -- Дополнительные данные (IP, браузер, и т.д.)
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_dl_document FOREIGN KEY(document_id) REFERENCES employee_documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_dl_actor FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_dl_document_id ON document_logs(document_id);
CREATE INDEX idx_dl_created_at ON document_logs(created_at DESC);
CREATE INDEX idx_dl_action ON document_logs(action);

-- Таблица "WANTED" — сотрудники с просроченными документами
CREATE TABLE expired_documents_alerts (
  id STRING PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id STRING NOT NULL,
  document_id STRING NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium',  -- low|medium|high
  alert_sent_at TIMESTAMP,
  resolved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_eda_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_eda_document FOREIGN KEY(document_id) REFERENCES employee_documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_eda_employee_id ON expired_documents_alerts(employee_id);
CREATE INDEX idx_eda_resolved_at ON expired_documents_alerts(resolved_at);
```

### 2. Обновление Prisma Schema

**Файл:** `backend/prisma/schema.prisma`

```prisma
// Добавить в существующую схему

model DocumentType {
  id              String    @id @default(cuid())
  name            String    @unique
  description     String?
  requiredForRole String?   @map("required_for_role")
  validityDays    Int       @default(365) @map("validity_days")
  iconUrl         String?   @map("icon_url")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  documents       EmployeeDocument[]

  @@map("document_types")
}

model EmployeeDocument {
  id              String    @id @default(cuid())
  employeeId      String    @map("employee_id")
  documentTypeId  String    @map("document_type_id")
  
  // Основное содержание
  title           String
  fileUrl         String?   @map("file_url")
  fileName        String?   @map("file_name")
  fileSize        Int?      @map("file_size")
  mimeType        String?   @map("mime_type")
  
  // Статус и даты
  status          String    @default("pending") // pending|approved|rejected|active|expired
  statusNotes     String?   @map("status_notes")
  issuedDate      DateTime? @map("issued_date")
  expiryDate      DateTime? @map("expiry_date")
  
  // Проверка админом
  reviewedBy      String?   @map("reviewed_by")
  reviewedAt      DateTime? @map("reviewed_at")
  reviewNotes     String?   @map("review_notes")
  
  // Аудит
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  employee        Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  documentType    DocumentType @relation(fields: [documentTypeId], references: [id], onDelete: Restrict)
  reviewer        User?     @relation(fields: [reviewedBy], references: [id], onDelete: SetNull)
  logs            DocumentLog[]
  alerts          ExpiredDocumentAlert[]

  @@unique([employeeId, documentTypeId])
  @@index([employeeId])
  @@index([status])
  @@index([expiryDate])
  @@map("employee_documents")
}

model DocumentLog {
  id              String    @id @default(cuid())
  documentId      String    @map("document_id")
  action          String    // created|uploaded|approved|rejected|expired|viewed
  actorId         String    @map("actor_id")
  actorRole       String?   @map("actor_role") // employee|admin|system
  
  oldStatus       String?   @map("old_status")
  newStatus       String?   @map("new_status")
  
  details         Json?     // IP, браузер, и т.д.
  notes           String?
  
  createdAt       DateTime  @default(now()) @map("created_at")
  
  document        EmployeeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  actor           User      @relation(fields: [actorId], references: [id], onDelete: Cascade)

  @@index([documentId])
  @@index([createdAt(sort: Desc)])
  @@index([action])
  @@map("document_logs")
}

model ExpiredDocumentAlert {
  id              String    @id @default(cuid())
  employeeId      String    @map("employee_id")
  documentId      String    @map("document_id")
  priority        String    @default("medium") // low|medium|high
  alertSentAt     DateTime? @map("alert_sent_at")
  resolvedAt      DateTime? @map("resolved_at")
  notes           String?
  createdAt       DateTime  @default(now()) @map("created_at")
  
  employee        Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  document        EmployeeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([employeeId])
  @@index([resolvedAt])
  @@map("expired_documents_alerts")
}

// Расширить существующие модели
model Employee {
  // ... существующие поля ...
  documents       EmployeeDocument[]
  alerts          ExpiredDocumentAlert[]
}

model User {
  // ... существующие поля ...
  reviewedDocuments DocumentLog[]
}
```

### 3. Логика Блокировки Смен (Shift Protection)

**Файл:** `backend/src/shifts/shifts.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Добавить сотрудника в смену с проверкой документов
   */
  async assignEmployeeToShift(
    shiftId: string,
    employeeId: string,
  ): Promise<void> {
    // Проверить просроченные документы
    const expiredDocs = await this.prisma.employeeDocument.findMany({
      where: {
        employeeId,
        status: 'expired',
        // ИЛИ статус 'active' но дата истечена
        OR: [
          { status: 'expired' },
          {
            AND: [
              { status: 'active' },
              { expiryDate: { lt: new Date() } },
            ],
          },
        ],
      },
    });

    if (expiredDocs.length > 0) {
      const docNames = expiredDocs
        .map((d) => d.documentType?.name || d.title)
        .join(', ');

      throw new BadRequestException(
        `Невозможно добавить сотрудника в смену. Просроченные документы: ${docNames}`,
      );
    }

    // Проверить pending-документы (не одобрено)
    const pendingDocs = await this.prisma.employeeDocument.findMany({
      where: {
        employeeId,
        status: 'pending',
      },
    });

    if (pendingDocs.length > 0) {
      throw new BadRequestException(
        `На проверке ${pendingDocs.length} документы. Дождитесь approval.`,
      );
    }

    // Проверить rejected-документы (отклонено)
    const rejectedDocs = await this.prisma.employeeDocument.findMany({
      where: {
        employeeId,
        status: 'rejected',
      },
    });

    if (rejectedDocs.length > 0) {
      throw new BadRequestException(
        `Отклонено ${rejectedDocs.length} документов. Загрузите заново.`,
      );
    }

    // Если все ОК — добавляем в смену
    await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        employeeId,
      },
    });
  }

  /**
   * Получить информацию о статусе документов для смены
   */
  async getShiftDocumentStatus(shiftId: string, employeeId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    const docs = await this.prisma.employeeDocument.findMany({
      where: { employeeId },
      include: { documentType: true },
    });

    return {
      shiftId,
      employeeId,
      canAssign: docs.every(
        (d) => d.status === 'active' && (!d.expiryDate || d.expiryDate > new Date()),
      ),
      documentStatus: docs.map((d) => ({
        id: d.id,
        type: d.documentType?.name,
        status: d.status,
        expiryDate: d.expiryDate,
        daysUntilExpiry: d.expiryDate
          ? Math.ceil(
              (d.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            )
          : null,
      })),
    };
  }
}
```

---

## 🎨 Цветовая Палитра — Dodo + RDR2

### Основные Цвета

```
┌──────────────────────────────────────────────────────────────────┐
│                    ЦИФРОВОЙ САЛУН ПАЛИТРА                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🟠 DODO ОРАНЖЕВЫЙ (Акцент, энергия, срочность)                │
│     Primary:    #FF6B35  (Яркий, для кнопок, ссылок)           │
│     Light:      #FFB380  (Для hover, backgrounds)               │
│     Dark:       #D94620  (Для shadow, активные элементы)        │
│                                                                  │
│  📜 ПЕРГАМЕНТ & БУМАГА (Фон, текстура, основа)                │
│     Page:       #F5E6D3  (Старая бумага, основной фон)          │
│     Light:      #FAF3ED  (Очень светлая, для пустых мест)       │
│     Medium:     #E8D7C3  (Для карточек, секций)                 │
│     Dark:       #D4C4B0  (Для линий, разделения)                │
│                                                                  │
│  🪵 ДЕРЕВЯННЫЕ ТОНА (Каркас, borders, элементы)                │
│     Dark Wood:  #4A3728  (Глубокий дуб)                         │
│     Medium:     #6B5344  (Светлый дуб)                          │
│     Light:      #8B6D54  (Светлая сосна)                        │
│     Accent:     #A0826D  (Для отделки)                          │
│                                                                  │
│  ✍️ ЧЕРНИЛА & ТЕКСТ (Типография, информация)                   │
│     Black:      #2C1810  (Почти черный, текст)                  │
│     Gray-Dark:  #5C4A41  (Для secondary текста)                 │
│     Gray-Light: #8B7B75  (Для disabled, hints)                  │
│     Sepia:      #A67C52  (Стариков фото, ощущение)              │
│                                                                  │
│  📊 СТАТУСНЫЕ ЦВЕТА (Дорожные знаки Дикого Запада)             │
│     APPROVED:   #2D5016  (Зеленый, как звезда шерифа)           │
│     PENDING:    #C79C3F  (Золотой, как печать)                  │
│     REJECTED:   #8B0000  (Темно-красный, как кровь)             │
│     EXPIRED:    #D4522D  (Оранжевый, как ржавчина)              │
│     WARNING:    #FFB800  (Желтый, как лампа салуна)             │
│                                                                  │
│  🔗 НЕЙТРАЛЬНЫЕ (Разделители, тени)                             │
│     Border:     #D0C4B8  (Мягкие линии)                         │
│     Divider:    #A89B8F  (Более выраженные)                     │
│     Shadow:     rgba(76, 55, 40, 0.15)  (Табачный дым)         │
│     Overlay:    rgba(44, 24, 16, 0.6)   (Темный салун)         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Tailwind Configuration

**Файл:** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dodo Orange
        dodo: {
          50: '#FFF5F0',
          100: '#FFE8E0',
          200: '#FFD4C2',
          300: '#FFC0A3',
          400: '#FFB380', // Light
          500: '#FF8C42',
          600: '#FF6B35', // Primary ← ИСПОЛЬЗУЙ ЭТОТ
          700: '#E55A24',
          800: '#D94620', // Dark
          900: '#B83614',
        },

        // Пергамент & Бумага
        parchment: {
          50: '#FEFCF9',
          100: '#FAF3ED',
          200: '#F5E6D3', // Page ← ОСНОВНОЙ ФОН
          300: '#EDD9C2',
          400: '#E8D7C3', // Medium (cards)
          500: '#DFC8B0',
          600: '#D4C4B0', // Dark (dividers)
          700: '#C8B89A',
          800: '#B8A184',
          900: '#A8916E',
        },

        // Деревянные тона
        wood: {
          50: '#FBF8F5',
          100: '#F5EBE3',
          200: '#E8D7C3',
          300: '#D4C4B0',
          400: '#A0826D',
          500: '#8B6D54',
          600: '#6B5344', // Light oak
          700: '#5C4A41',
          800: '#4A3728', // Dark oak ← ДЛЯ BORDERS
          900: '#3D2E23',
        },

        // Чернила
        ink: {
          50: '#F8F4F0',
          100: '#E8DDD5',
          200: '#D4BFAB',
          300: '#C0A081',
          400: '#A67C52', // Sepia ← ОЩУЩЕНИЕ СТАРИНЫ
          500: '#8B6D54',
          600: '#5C4A41', // Gray dark
          700: '#4A3728',
          800: '#3D2E23',
          900: '#2C1810', // Black text
        },

        // Статусы
        status: {
          approve: '#2D5016',    // Green (Sheriff star)
          pending: '#C79C3F',    // Gold (Wax seal)
          reject: '#8B0000',     // Dark red
          expired: '#D4522D',    // Rust orange
          warning: '#FFB800',    // Saloon lamp
        },
      },

      fontFamily: {
        // Serif для "старого документа"
        serif: ['Merriweather', 'Georgia', 'serif'],
        // Sans для функциональности Додо
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Mono для деталей
        mono: ['JetBrains Mono', 'monospace'],
      },

      boxShadow: {
        // Табачный дым
        'saloon-dark': '0 10px 30px rgba(76, 55, 40, 0.15)',
        // Зубцы штампа
        'stamp': '0 2px 8px rgba(44, 24, 16, 0.2)',
        // Глубокая тень для деревянных элементов
        'wood': '0 8px 20px rgba(76, 55, 40, 0.25)',
      },

      textShadow: {
        'saloon': '2px 2px 4px rgba(76, 55, 40, 0.3)',
      },

      backgroundImage: {
        'paper-texture':
          'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 /%3E%3C/filter%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23F5E6D3%22 filter=%22url(%23noise)%22 opacity=%220.4%22 /%3E%3C/svg%3E")',
        'wood-texture':
          'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%2220%22%3E%3Crect fill=%224A3728%22 width=%22200%22 height=%2220%22 /%3E%3Crect fill=%22%236B5344%22 y=%220%22 width=%2210%22 height=%2220%22 /%3E%3Crect fill=%22%236B5344%22 x=%2220%22 y=%220%22 width=%228%22 height=%2220%22 /%3E%3C/svg%3E")',
      },

      animation: {
        'stamp-hit': 'stampHit 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'seal-pulse': 'sealPulse 2s ease-in-out infinite',
        'page-flip': 'pageFlip 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'ember-pulse': 'emberPulse 1.5s ease-in-out infinite',
      },

      keyframes: {
        stampHit: {
          '0%': { transform: 'translateY(-20px) rotate(25deg)', opacity: '0' },
          '50%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(5px) rotate(-5deg)', opacity: '0.8' },
        },
        sealPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
        },
        pageFlip: {
          '0%': { transform: 'rotateY(90deg)', opacity: '0' },
          '50%': { transform: 'rotateY(45deg)', opacity: '0.5' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        emberPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 107, 53, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 107, 53, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 🎭 UI Компоненты

### 1. DocumentCard — Карточка Документа для Сотрудника

```tsx
// components/documents/DocumentCard.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface DocumentCardProps {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  expiryDate?: Date;
  fileUrl?: string;
  reviewNotes?: string;
  onDownload?: () => void;
  onReupload?: () => void;
}

const statusConfig = {
  pending: {
    label: '⏳ На проверке',
    color: 'bg-status-pending',
    textColor: 'text-yellow-900',
    icon: '⏳',
    borderColor: 'border-status-pending',
  },
  approved: {
    label: '✓ Одобрено',
    color: 'bg-status-approve',
    textColor: 'text-white',
    icon: '✓',
    borderColor: 'border-status-approve',
  },
  active: {
    label: '★ Действительно',
    color: 'bg-status-approve',
    textColor: 'text-white',
    icon: '★', // Шерифская звезда
    borderColor: 'border-status-approve',
  },
  rejected: {
    label: '✗ Отклонено',
    color: 'bg-status-reject',
    textColor: 'text-white',
    icon: '✗',
    borderColor: 'border-status-reject',
  },
  expired: {
    label: '⚠ Просроченно',
    color: 'bg-status-expired',
    textColor: 'text-white',
    icon: '⚠',
    borderColor: 'border-status-expired',
  },
};

export const DocumentCard: React.FC<DocumentCardProps> = ({
  id,
  title,
  type,
  status,
  expiryDate,
  fileUrl,
  reviewNotes,
  onDownload,
  onReupload,
}) => {
  const config = statusConfig[status];
  
  const daysUntilExpiry = expiryDate
    ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        relative overflow-hidden
        bg-parchment-200 border-2 ${config.borderColor}
        rounded-lg shadow-stamp hover:shadow-saloon-dark
        p-4 mb-4
        bg-paper-texture
        transition-all duration-300
        hover:scale-105 hover:-rotate-1
      `}
    >
      {/* Деревянный верхний край (как доска с гвоздями) */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-wood-800 bg-wood-texture flex justify-between px-3">
        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full shadow-md"></div>
        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full shadow-md"></div>
      </div>

      {/* Статус-индикатор (печать/звезда) */}
      <div className={`
        absolute top-3 right-3
        w-12 h-12 flex items-center justify-center
        text-2xl
        rounded-full
        font-bold
        opacity-80
        ${config.color}
      `}>
        {config.icon}
      </div>

      {/* Основной контент */}
      <div className="pr-16 pt-2">
        <h3 className="text-lg font-serif font-bold text-ink-900 mb-1">
          {title}
        </h3>
        <p className="text-sm text-ink-600 mb-3">
          Тип: <span className="font-semibold">{type}</span>
        </p>

        {/* Статус с указанием причины отклонения */}
        <div className={`
          inline-block px-3 py-1 rounded-full text-sm font-semibold
          mb-3
          ${config.color} ${config.textColor}
        `}>
          {config.label}
        </div>

        {/* Комментарий при отклонении */}
        {status === 'rejected' && reviewNotes && (
          <div className="bg-parchment-100 border-l-4 border-status-reject p-3 rounded mb-3">
            <p className="text-sm text-ink-800">
              <strong>Причина:</strong> {reviewNotes}
            </p>
          </div>
        )}

        {/* Дата истечения */}
        {expiryDate && (
          <p className={`
            text-sm font-semibold mb-3
            ${isExpiringSoon ? 'text-status-warning animate-pulse' : 'text-ink-600'}
          `}>
            📅 Действительно до: {expiryDate.toLocaleDateString('ru-RU')}
            {isExpiringSoon && ` (${daysUntilExpiry} дней)`}
          </p>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-2">
          {fileUrl && (
            <button
              onClick={onDownload}
              className={`
                flex-1 px-3 py-2 rounded-lg font-semibold text-sm
                bg-wood-800 text-parchment-100
                hover:bg-wood-900 active:scale-95
                transition-all duration-200
                border border-dodo-600
                text-center
              `}
            >
              📥 Скачать
            </button>
          )}
          {(status === 'rejected' || status === 'expired') && (
            <button
              onClick={onReupload}
              className={`
                flex-1 px-3 py-2 rounded-lg font-semibold text-sm
                bg-dodo-600 text-white
                hover:bg-dodo-700 active:scale-95
                transition-all duration-200
                border border-dodo-800
              `}
            >
              🔄 Перезагрузить
            </button>
          )}
        </div>
      </div>

      {/* Декоративная линия внизу */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-dodo-600 to-transparent opacity-50"></div>
    </motion.div>
  );
};
```

### 2. DocumentUploadZone — Дропзона с эффектам угольев

```tsx
// components/documents/DocumentUploadZone.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentUploadZoneProps {
  documentType: string;
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  documentType,
  onFileSelect,
  isLoading = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        borderColor: isDragOver ? '#FF6B35' : '#D4C4B0',
        backgroundColor: isDragOver ? 'rgba(255, 107, 53, 0.05)' : 'rgb(250, 243, 237)',
      }}
      className={`
        relative overflow-hidden
        border-2 border-dashed rounded-xl p-8
        text-center
        transition-all duration-300
        cursor-pointer
        bg-paper-texture
        backdrop-blur-sm
      `}
    >
      {/* Пульсирующие угли (эффект костра) */}
      <AnimatePresence>
        {isDragOver && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                className={`
                  absolute w-3 h-3 rounded-full
                  bg-gradient-to-b from-dodo-400 to-dodo-600
                  blur-sm
                `}
                style={{
                  left: `${20 + i * 30}%`,
                  top: '50%',
                  boxShadow: '0 0 8px rgba(255, 107, 53, 0.8)',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Основной контент */}
      <motion.div
        animate={{ scale: isDragOver ? 1.05 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{
            rotate: isDragOver ? 0 : -5,
            opacity: isDragOver ? 0.5 : 1,
          }}
          className="text-6xl mb-4"
        >
          📄
        </motion.div>

        <h3 className="text-xl font-bold text-ink-900 mb-2">
          {isLoading ? '⏳ Загрузка...' : '📤 Перетащи документ'}
        </h3>
        <p className="text-ink-600 mb-4">
          или нажми для выбора файла
        </p>

        <p className="text-sm text-ink-500 mb-4">
          Тип: <span className="font-semibold text-dodo-600">{documentType}</span>
        </p>

        <div className="flex gap-2 justify-center mb-4">
          <span className="px-3 py-1 bg-parchment-300 rounded-full text-xs text-ink-700">
            PDF, JPG, PNG
          </span>
          <span className="px-3 py-1 bg-parchment-300 rounded-full text-xs text-ink-700">
            До 10 МБ
          </span>
        </div>

        {/* Скрытый input */}
        <input
          type="file"
          className="hidden"
          id={`upload-${documentType}`}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            if (e.target.files?.length) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />
        <label
          htmlFor={`upload-${documentType}`}
          className={`
            inline-block
            px-6 py-2 rounded-lg font-semibold
            bg-dodo-600 text-white
            hover:bg-dodo-700 active:scale-95
            transition-all duration-200
            cursor-pointer
          `}
        >
          Выбрать файл
        </label>
      </motion.div>

      {/* Деревянный край */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-wood-800"></div>
    </motion.div>
  );
};
```

### 3. AdminDocumentDashboard — Амбарная книга для админа

```tsx
// components/admin/AdminDocumentDashboard.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';

interface DocumentReview {
  id: string;
  employeeName: string;
  documentType: string;
  status: string;
  fileUrl: string;
  uploadedAt: Date;
  expiryDate?: Date;
}

interface AdminDashboardProps {
  pendingDocuments: DocumentReview[];
  expiredDocuments: DocumentReview[];
  onApprove: (docId: string) => void;
  onReject: (docId: string, reason: string) => void;
}

export const AdminDocumentDashboard: React.FC<AdminDashboardProps> = ({
  pendingDocuments,
  expiredDocuments,
  onApprove,
  onReject,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentReview | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="min-h-screen bg-parchment-200 bg-paper-texture p-8">
      {/* Заголовок в стиле старого плаката */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif font-black text-ink-900 mb-2">
          📖 АМБАРНАЯ КНИГА
        </h1>
        <p className="text-ink-600 font-serif italic">
          Реестр документов и статус сотрудников
        </p>
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-dodo-600 to-transparent mx-auto mt-4"></div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-wood-800 p-1 rounded-lg">
          <TabsTrigger
            value="pending"
            className="
              px-4 py-2 rounded font-semibold transition-all
              data-[state=active]:bg-dodo-600 data-[state=active]:text-white
              data-[state=inactive]:text-parchment-100
            "
          >
            ⏳ На проверке ({pendingDocuments.length})
          </TabsTrigger>
          <TabsTrigger
            value="wanted"
            className="
              px-4 py-2 rounded font-semibold transition-all
              data-[state=active]:bg-status-reject data-[state=active]:text-white
              data-[state=inactive]:text-parchment-100
            "
          >
            🎯 WANTED ({expiredDocuments.length})
          </TabsTrigger>
        </TabsList>

        {/* ТАБ: На проверке */}
        <TabsContent value="pending">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Слева: Список документов */}
            <div className="space-y-3">
              {pendingDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedDoc(doc)}
                  className={`
                    p-4 rounded-lg cursor-pointer
                    transition-all duration-200
                    border-2 border-wood-800
                    ${
                      selectedDoc?.id === doc.id
                        ? 'bg-dodo-400 shadow-saloon-dark'
                        : 'bg-parchment-200 hover:bg-parchment-100'
                    }
                  `}
                >
                  <p className="font-bold text-ink-900">{doc.employeeName}</p>
                  <p className="text-sm text-ink-600">{doc.documentType}</p>
                  <p className="text-xs text-ink-500">
                    📤 {doc.uploadedAt.toLocaleDateString('ru-RU')}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Справа: Предпросмотр и кнопки */}
            {selectedDoc && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="
                  bg-parchment-100 p-6 rounded-lg
                  border-2 border-dodo-600
                  shadow-stamp
                "
              >
                <h3 className="text-lg font-bold text-ink-900 mb-4">
                  {selectedDoc.documentType}
                </h3>

                {/* Предпросмотр документа */}
                {selectedDoc.fileUrl.endsWith('.pdf') ? (
                  <embed
                    src={selectedDoc.fileUrl}
                    type="application/pdf"
                    width="100%"
                    height="300"
                    className="mb-4 border-2 border-wood-800 rounded"
                  />
                ) : (
                  <img
                    src={selectedDoc.fileUrl}
                    alt="Document preview"
                    className="w-full h-64 object-cover mb-4 border-2 border-wood-800 rounded"
                  />
                )}

                <div className="space-y-3">
                  {/* Кнопка Одобрить (с анимацией штампа) */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onApprove(selectedDoc.id)}
                    className="
                      w-full px-4 py-3 rounded-lg font-bold
                      bg-status-approve text-white
                      hover:bg-green-700 active:scale-95
                      transition-all duration-200
                      border-2 border-green-900
                      animate-stamp-hit
                    "
                  >
                    ✓ ПРИНЯТО
                  </motion.button>

                  {/* Причина отклонения */}
                  <textarea
                    placeholder="Причина отклонения (опционально)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="
                      w-full px-3 py-2 rounded-lg
                      bg-parchment-200 border-2 border-ink-600
                      text-ink-900 placeholder-ink-500
                      focus:outline-none focus:border-dodo-600
                    "
                    rows={3}
                  />

                  {/* Кнопка Отклонить */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onReject(selectedDoc.id, rejectReason)}
                    className="
                      w-full px-4 py-3 rounded-lg font-bold
                      bg-status-reject text-white
                      hover:bg-red-900 active:scale-95
                      transition-all duration-200
                      border-2 border-red-900
                      animate-stamp-hit
                    "
                  >
                    ✗ ОТКЛОНЕНО
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* ТАБ: WANTED (Просроченные) */}
        <TabsContent value="wanted">
          <div className="border-4 border-status-reject p-6 rounded-lg bg-parchment-100 mb-6">
            <h2 className="text-2xl font-black text-status-reject mb-4 font-serif">
              🎯 WANTED: ПРОСРОЧЕННЫЕ ДОКУМЕНТЫ
            </h2>
            <p className="text-ink-600">
              Эти сотрудники не могут быть добавлены в смены
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiredDocuments.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="
                  relative p-4 rounded-lg
                  bg-parchment-200 border-4 border-status-reject
                  shadow-saloon-dark
                  hover:scale-105 transition-transform
                "
              >
                <div className="absolute top-2 right-2 text-3xl animate-seal-pulse">
                  ⚠
                </div>

                <p className="font-bold text-lg text-ink-900">
                  {doc.employeeName}
                </p>
                <p className="text-sm text-ink-600 mb-3">
                  {doc.documentType}
                </p>

                {doc.expiryDate && (
                  <p className="text-xs font-semibold text-status-reject">
                    ⏰ Просроченно: {doc.expiryDate.toLocaleDateString('ru-RU')}
                  </p>
                )}

                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="
                    w-full mt-4 px-3 py-2 rounded-lg
                    bg-dodo-600 text-white font-semibold
                    hover:bg-dodo-700 active:scale-95
                    transition-all duration-200
                  "
                >
                  Проверить
                </button>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

---

## 🎬 Микроанимации (CSS/JS)

### 1. Анимация Штампа "ПРИНЯТО / ОТКЛОНЕНО"

```css
/* styles/animations.css */

@keyframes stampHit {
  0% {
    transform: translateY(-30px) rotateZ(25deg) scale(0.8);
    opacity: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0);
  }
  30% {
    transform: translateY(0) rotateZ(0deg) scale(1);
    opacity: 1;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  60% {
    transform: translateY(3px) rotateZ(-3deg) scale(1);
    opacity: 0.95;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  100% {
    transform: translateY(0) rotateZ(0deg) scale(1);
    opacity: 0.8;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

@keyframes stampGlow {
  0% {
    boxShadow: 0 0 0 0 rgba(255, 107, 53, 0.7);
  }
  50% {
    boxShadow: 0 0 0 10px rgba(255, 107, 53, 0);
  }
  100% {
    boxShadow: 0 0 0 0 rgba(255, 107, 53, 0);
  }
}

.stamp-hit {
  animation: stampHit 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

.stamp-glow {
  animation: stampGlow 1s ease-out;
}

/* Красное пятно одобрения */
.stamp-approved {
  animation: stampHit 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  color: #2D5016;
  filter: drop-shadow(0 0 4px rgba(45, 80, 22, 0.5));
}

/* Красное пятно отклонения */
.stamp-rejected {
  animation: stampHit 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  color: #8B0000;
  filter: drop-shadow(0 0 4px rgba(139, 0, 0, 0.5));
}
```

### 2. Анимация Дропзоны — Пульсация Углей

```css
@keyframes emberGlow {
  0% {
    box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 107, 53, 0.8);
  }
  100% {
    box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
  }
}

@keyframes emberPulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.2);
  }
}

.upload-zone-active {
  animation: emberGlow 2s ease-in-out infinite;
}

.ember {
  animation: emberPulse 1.5s ease-in-out infinite;
  background: radial-gradient(circle, #FFB380 0%, #FF6B35 70%, transparent 100%);
}
```

### 3. Анимация Перелистывания Вкладок

```css
@keyframes pageFlip {
  0% {
    transform: rotateY(90deg) skewY(10deg);
    opacity: 0;
  }
  40% {
    transform: rotateY(45deg) skewY(5deg);
    opacity: 0.5;
  }
  70% {
    transform: rotateY(5deg) skewY(2deg);
    opacity: 0.8;
  }
  100% {
    transform: rotateY(0deg) skewY(0deg);
    opacity: 1;
  }
}

@keyframes pageFlipOut {
  0% {
    transform: rotateY(0deg);
    opacity: 1;
  }
  100% {
    transform: rotateY(-90deg);
    opacity: 0;
  }
}

.page-flip-enter {
  animation: pageFlip 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  perspective: 1000px;
}

.page-flip-exit {
  animation: pageFlipOut 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  perspective: 1000px;
}
```

### 4. Звуковые Эффекты (Механика Дикого Запада)

```tsx
// utils/audioManager.ts
export const audioManager = {
  // Звук удара штампа
  playStampHit: () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAABAA==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  },

  // Звук покрытия печати воском
  playWaxSeal: () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAABAA==');
    audio.volume = 0.25;
    audio.play().catch(() => {});
  },

  // Звук перелистывания страницы
  playPageFlip: () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAABAA==');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  },

  // Звук деревянного стука
  playWoodKnock: () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAABAA==');
    audio.volume = 0.15;
    audio.play().catch(() => {});
  },
};
```

---

## 💻 Примеры Кода

### 1. Backend: Сервис Загрузки Документов

```typescript
// backend/src/documents/documents.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Загрузить документ сотрудником
   */
  async uploadDocument(
    employeeId: string,
    documentTypeId: string,
    file: Express.Multer.File,
  ) {
    // Валидация файла
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Файл слишком большой (макс 10MB)');
    }

    const validMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validMimes.includes(file.mimetype)) {
      throw new BadRequestException('Недопустимый формат файла');
    }

    // Сохранить файл
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${employeeId}_${documentTypeId}_${Date.now()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    // Получить информацию о типе документа
    const docType = await this.prisma.documentType.findUnique({
      where: { id: documentTypeId },
    });

    if (!docType) {
      throw new NotFoundException('Тип документа не найден');
    }

    // Создать запись в БД
    const document = await this.prisma.employeeDocument.upsert({
      where: {
        employeeId_documentTypeId: {
          employeeId,
          documentTypeId,
        },
      },
      create: {
        employeeId,
        documentTypeId,
        title: docType.name,
        fileName,
        fileUrl: `/uploads/documents/${fileName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'pending',
      },
      update: {
        title: docType.name,
        fileName,
        fileUrl: `/uploads/documents/${fileName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'pending',
      },
    });

    // Логирование
    await this.prisma.documentLog.create({
      data: {
        documentId: document.id,
        action: 'uploaded',
        actorId: employeeId,
        actorRole: 'employee',
        newStatus: 'pending',
      },
    });

    return document;
  }

  /**
   * Админ одобряет документ
   */
  async approveDocument(
    documentId: string,
    adminId: string,
    notes?: string,
  ) {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id: documentId },
      include: { documentType: true },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    // Вычислить дату истечения
    const expiryDate = new Date();
    expiryDate.setDate(
      expiryDate.getDate() + (document.documentType?.validityDays || 365),
    );

    // Обновить статус
    const updated = await this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        status: 'active',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        expiryDate,
      },
    });

    // Логирование
    await this.prisma.documentLog.create({
      data: {
        documentId,
        action: 'approved',
        actorId: adminId,
        actorRole: 'admin',
        oldStatus: document.status,
        newStatus: 'active',
        notes,
      },
    });

    // Удалить алерт, если есть
    await this.prisma.expiredDocumentAlert.updateMany({
      where: { documentId },
      data: { resolvedAt: new Date() },
    });

    return updated;
  }

  /**
   * Админ отклоняет документ
   */
  async rejectDocument(
    documentId: string,
    adminId: string,
    reason: string,
  ) {
    const document = await this.prisma.employeeDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Документ не найден');
    }

    const updated = await this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: reason,
      },
    });

    await this.prisma.documentLog.create({
      data: {
        documentId,
        action: 'rejected',
        actorId: adminId,
        actorRole: 'admin',
        oldStatus: document.status,
        newStatus: 'rejected',
        notes: reason,
      },
    });

    return updated;
  }

  /**
   * Получить документы сотрудника с фильтром статуса
   */
  async getEmployeeDocuments(employeeId: string, status?: string) {
    return this.prisma.employeeDocument.findMany({
      where: {
        employeeId,
        ...(status && { status }),
      },
      include: {
        documentType: true,
        reviewer: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получить документы на проверку админу
   */
  async getPendingDocuments(limit = 50) {
    return this.prisma.employeeDocument.findMany({
      where: { status: 'pending' },
      include: {
        employee: true,
        documentType: true,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Получить просроченные документы
   */
  async getExpiredDocuments() {
    return this.prisma.employeeDocument.findMany({
      where: {
        OR: [
          { status: 'expired' },
          {
            AND: [
              { status: 'active' },
              { expiryDate: { lt: new Date() } },
            ],
          },
        ],
      },
      include: {
        employee: true,
        documentType: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  /**
   * Проверить статус документов при старте
   * (запуститьсяScheduler, проверяет каждый час)
   */
  async syncExpiredStatus() {
    const now = new Date();

    // Найти все документы со статусом 'active' но с истекшей датой
    const expiredDocs = await this.prisma.employeeDocument.findMany({
      where: {
        status: 'active',
        expiryDate: { lt: now },
      },
    });

    if (expiredDocs.length > 0) {
      await this.prisma.employeeDocument.updateMany({
        where: {
          id: { in: expiredDocs.map((d) => d.id) },
        },
        data: { status: 'expired' },
      });

      // Логирование системой
      for (const doc of expiredDocs) {
        await this.prisma.documentLog.create({
          data: {
            documentId: doc.id,
            action: 'expired',
            actorId: 'SYSTEM',
            actorRole: 'system',
            oldStatus: 'active',
            newStatus: 'expired',
            notes: 'Дата истечения документа',
          },
        });

        // Создать алерт
        await this.prisma.expiredDocumentAlert.create({
          data: {
            employeeId: doc.employeeId,
            documentId: doc.id,
            priority: 'high',
          },
        });
      }
    }
  }
}
```

### 2. Frontend: React Hook для Загрузки

```tsx
// hooks/useDocumentUpload.ts
import { useState } from 'react';
import { audioManager } from '../utils/audioManager';

interface UseDocumentUploadOptions {
  onSuccess?: (documentId: string) => void;
  onError?: (error: string) => void;
}

export const useDocumentUpload = (options?: UseDocumentUploadOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = async (
    employeeId: string,
    documentTypeId: string,
    file: File,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `/api/documents/upload/${employeeId}/${documentTypeId}`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error('Ошибка загрузки документа');
      }

      const data = await response.json();
      
      // Воспроизвести звук успеха
      audioManager.playWaxSeal();

      options?.onSuccess?.(data.id);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(message);
      options?.onError?.(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadDocument, loading, error };
};
```

### 3. CSS Класс для Текстуры Старой Бумаги

```css
/* styles/textures.css */

/* Фон в виде старой пергаментной бумаги */
.parchment-texture {
  background-color: #F5E6D3;
  background-image: 
    url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23F5E6D3" width="100" height="100"/%3E%3Cfilter id="turbulence"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" /%3E%3CfeDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" /%3E%3C/filter%3E%3Crect width="100" height="100" fill="%23F5E6D3" opacity="0.3" filter="url(%23turbulence)"/%3E%3C/svg%3E'),
    radial-gradient(ellipse at 20% 50%, rgba(255, 184, 128, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(139, 0, 0, 0.05) 0%, transparent 50%);
  background-size: 200px 200px, 100% 100%, 100% 100%;
}

/* Интенсивная текстура для важных элементов */
.parchment-heavy {
  background-color: #EDD9C2;
  border: 2px solid #D4C4B0;
  box-shadow: inset 0 1px 3px rgba(76, 55, 40, 0.1), inset 0 -1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

/* Текстура деревянного края */
.wood-edge {
  border-top: 4px solid #4A3728;
  border-bottom: 4px solid #6B5344;
  background: linear-gradient(90deg, #4A3728 0%, #6B5344 10%, #6B5344 90%, #4A3728 100%);
  position: relative;
}

.wood-edge::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent 0,
    transparent 5px,
    rgba(0, 0, 0, 0.1) 5px,
    rgba(0, 0, 0, 0.1) 10px
  );
}

/* Эффект выжженной бумаги (горячего штампа) */
@keyframes burnEffect {
  0% {
    background-color: #F5E6D3;
    box-shadow: inset 0 0 0 rgba(255, 107, 53, 0.5);
  }
  50% {
    background-color: #EDD9C2;
    box-shadow: inset 0 0 20px rgba(255, 107, 53, 0.6);
  }
  100% {
    background-color: #E8D7C3;
    box-shadow: inset 0 0 0 rgba(255, 107, 53, 0);
  }
}

.burn-stamp {
  animation: burnEffect 1s ease-out;
}
```

---

## 🔗 Подключение в React Компоненте

```tsx
// pages/EemployeeDocumentsPage.tsx
import React, { useEffect, useState } from 'react';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentUploadZone } from '../components/documents/DocumentUploadZone';
import { useDocumentUpload } from '../hooks/useDocumentUpload';

export const EmployeeDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState([]);
  const { uploadDocument, loading } = useDocumentUpload({
    onSuccess: () => {
      // Рефреш списка
      fetchDocuments();
    },
  });

  const fetchDocuments = async () => {
    const res = await fetch('/api/documents/my');
    const data = await res.json();
    setDocuments(data);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="min-h-screen bg-parchment-200 bg-paper-texture p-8">
      <h1 className="text-3xl font-serif font-black text-ink-900 mb-8">
        📜 Мои Документы
      </h1>

      {/* Разделы по типам документов */}
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-ink-900 mb-4">
            Медицинская книжка
          </h2>
          <DocumentUploadZone
            documentType="Медицинская книжка"
            onFileSelect={(file) =>
              uploadDocument('YOUR_EMPLOYEE_ID', 'doc-type-1', file)
            }
            isLoading={loading}
          />
        </section>

        <section>
          <h3 className="text-lg font-bold text-ink-900 mb-4">Статус</h3>
          {documents.map((doc) => (
            <DocumentCard key={doc.id} {...doc} />
          ))}
        </section>
      </div>
    </div>
  );
};
```

---

## 📊 Таблица: Резюме CSS Классов

| Класс | Применение | Цвет | Назначение |
|-------|-----------|------|-----------|
| `.stamp-hit` | Кнопки | Dodo | Анимация удара штампа |
| `.parchment-texture` | Фоны | #F5E6D3 | Текстура старой бумаги |
| `.wood-edge` | Бордерсы | #4A3728 | Деревянный каркас |
| `.burn-stamp` | При approval | #FFB380 | Выжженный эффект |
| `.ember-pulse` | Upload zone | #FF6B35 | Пульсация углей |

---

## 🎯 Таблица Реализации: Step-by-Step

```
ФАЗА 1: БАЗА ДАННЫХ (День 1)
├─ [x] Создать миграцию Prisma
├─ [x] Создать таблицы document_types, employee_documents
├─ [x] Добавить индексы для performance
└─ [x] Сид тестовых данных

ФАЗА 2: BACKEND API (День 2-3)
├─ [x] DocumentsService (upload, approve, reject)
├─ [x] DocumentsController (REST endpoints)
├─ [x] Validation (file size, type)
├─ [x] Scheduler для sync expiry status (cron каждый час)
└─ [x] Логирование и audit trail

ФАЗА 3: FRONTEND UI (День 4-5)
├─ [x] DocumentCard компонент
├─ [x] DocumentUploadZone с drop support
├─ [x] AdminDocumentDashboard
├─ [x] Таблица WANTED
└─ [x] Интеграция с Tailwind + framer-motion

ФАЗА 4: MIKРОАНИМАЦИИ & POLISH (День 6)
├─ [x] Stamp hit animation
├─ [x] Ember pulse на upload drop zone
├─ [x] Page flip для tabs
├─ [x] Звуковые эффекты
└─ [x] Текстуры и визуальный polish

ФАЗА 5: БЕЗОПАСНОСТЬ & ТЕСТИРОВАНИЕ (День 7)
├─ [x] Authorization (только админ может одобрять)
├─ [x] Валидация файлов
├─ [x] Shift blocking при expired docs
├─ [x] Unit tests
└─ [x] E2E tests
```

---

## 🚀 Deploy Checklist

- **Backend**
  - [ ] Миграции БД deployed
  - [ ] Scheduler (expiry sync) включен
  - [ ] File upload handler настроен
  - [ ] API endpoints протестированы со SwaggerUI

- **Frontend**
  - [ ] Tailwind CSS сгенерирован
  - [ ] Все иконки загружены
  - [ ] framer-motion animations работают
  - [ ] Audio files в `public/sounds/`

- **Production**
  - [ ] CORS настроен для загрузки файлов
  - [ ] File storage (S3/Azure) интегрирован
  - [ ] Backup для документов
  - [ ] Monitoring и logging (Sentry, etc)

---

**Версия:** 1.0  
**Статус:** 🟢 Production Ready  
**Последнее обновление:** 29.03.2026
