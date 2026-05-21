# 🏗️ Практичные Примеры для Быстрого Старта
## Copy-Paste Collections

---

## 1️⃣ SQL: Быстрое Создание Таблиц

### Для PostgreSQL (если используешь jkh-web)

```sql
-- Создание всех таблиц одной трансакцией
BEGIN;

-- 1. ТИПЫ ДОКУМЕНТОВ (справочник)
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  required_for_role VARCHAR(100) DEFAULT 'employee', -- employee|manager|all
  validity_days INT DEFAULT 365,
  icon_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставить базовые типы документов
INSERT INTO document_types (name, description, validity_days, icon_url) VALUES
  ('Медицинская книжка', 'Санитарная книжка для пищевого производства', 365, '/icons/medical-book.svg'),
  ('Договор трудовой', 'Основной трудовой договор', 1095, '/icons/contract.svg'),
  ('Страховка (ДМС)', 'Добровольное медицинское страхование', 365, '/icons/insurance.svg'),
  ('Справка от врача', 'Справка о допуске к работе', 30, '/icons/doctor.svg');

-- 2. ДОКУМЕНТЫ СОТРУДНИКОВ (основная таблица)
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(255) NOT NULL,
  document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
  
  title VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000),
  file_name VARCHAR(255),
  file_size INT,
  mime_type VARCHAR(50),
  
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'expired')),
  status_notes TEXT,
  
  issued_date TIMESTAMP,
  expiry_date TIMESTAMP,
  
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT uk_emp_doc_unique UNIQUE(employee_id, document_type_id)
);

CREATE INDEX idx_emp_doc_employee ON employee_documents(employee_id);
CREATE INDEX idx_emp_doc_status ON employee_documents(status);
CREATE INDEX idx_emp_doc_expiry ON employee_documents(expiry_date);
CREATE INDEX idx_emp_doc_created ON employee_documents(created_at DESC);

-- 3. ЛОГ ДЕЙСТВИЙ (audit trail)
CREATE TABLE document_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES employee_documents(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- uploaded|approved|rejected|expired|viewed
  actor_id VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50), -- employee|admin|system
  
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  
  details JSONB,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_log_doc_id ON document_logs(document_id);
CREATE INDEX idx_doc_log_action ON document_logs(action);
CREATE INDEX idx_doc_log_created ON document_logs(created_at DESC);

-- 4. АЛЛЕРТЫ ДЛЯ ПРОСРОЧЕННЫХ (WANTED)
CREATE TABLE expired_document_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(255) NOT NULL,
  document_id UUID NOT NULL REFERENCES employee_documents(id) ON DELETE CASCADE,
  priority VARCHAR(50) DEFAULT 'medium', -- low|medium|high
  alert_sent_at TIMESTAMP,
  resolved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_employee ON expired_document_alerts(employee_id);
CREATE INDEX idx_alert_resolved ON expired_document_alerts(resolved_at);

COMMIT;
```

### Untuk SQLite (если используешь backend)

```sql
-- Создание таблиц для SQLite
-- Файл: backend/prisma/migrations/[date]_add_documents/migration.sql

CREATE TABLE document_types (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  required_for_role text DEFAULT 'employee',
  validity_days integer DEFAULT 365,
  icon_url text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_documents (
  id text PRIMARY KEY,
  employee_id text NOT NULL,
  document_type_id text NOT NULL,
  title text NOT NULL,
  file_url text,
  file_name text,
  file_size integer,
  mime_type text,
  status text DEFAULT 'pending',
  status_notes text,
  issued_date datetime,
  expiry_date datetime,
  reviewed_by text,
  reviewed_at datetime,
  review_notes text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(document_type_id) REFERENCES document_types(id),
  UNIQUE(employee_id, document_type_id)
);

CREATE INDEX idx_emp_doc_employee ON employee_documents(employee_id);
CREATE INDEX idx_emp_doc_status ON employee_documents(status);
CREATE INDEX idx_emp_doc_expiry ON employee_documents(expiry_date);

CREATE TABLE document_logs (
  id text PRIMARY KEY,
  document_id text NOT NULL,
  action text NOT NULL,
  actor_id text NOT NULL,
  actor_role text,
  old_status text,
  new_status text,
  details text,
  notes text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(document_id) REFERENCES employee_documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_doc_log_doc_id ON document_logs(document_id);

CREATE TABLE expired_document_alerts (
  id text PRIMARY KEY,
  employee_id text NOT NULL,
  document_id text NOT NULL,
  priority text DEFAULT 'medium',
  alert_sent_at datetime,
  resolved_at datetime,
  notes text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(document_id) REFERENCES employee_documents(id) ON DELETE CASCADE
);
```

---

## 2️⃣ Tailwind Config: Copy-Paste Полностью

**Файл:** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    colors: {
      // Базовые цвета
      white: '#FFFFFF',
      black: '#000000',
      transparent: 'transparent',

      // Dodo Orange - основная палитра
      dodo: {
        50: '#FFF5F0',
        100: '#FFE8E0',
        200: '#FFD4C2',
        300: '#FFC0A3',
        400: '#FFB380',
        500: '#FF8C42',
        600: '#FF6B35', // PRIMARY
        700: '#E55A24',
        800: '#D94620',
        900: '#B83614',
      },

      // Пергамент и бумага
      parchment: {
        50: '#FEFCF9',
        100: '#FAF3ED',
        150: '#F8EFE5',
        200: '#F5E6D3', // PAGE BG
        250: '#F0DCC5',
        300: '#EDD9C2',
        400: '#E8D7C3',
        500: '#DFC8B0',
        600: '#D4C4B0', // DIVIDER
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
        600: '#6B5344', // LIGHT OAK
        700: '#5C4A41',
        800: '#4A3728', // DARK OAK
        900: '#3D2E23',
      },

      // Чернила и текст
      ink: {
        50: '#F8F4F0',
        100: '#E8DDD5',
        200: '#D4BFAB',
        300: '#C0A081',
        400: '#A67C52', // SEPIA
        500: '#8B6D54',
        600: '#5C4A41', // GRAY DARK
        700: '#4A3728',
        800: '#3D2E23',
        900: '#2C1810', // TEXT
      },

      // Статус цвета
      approve: '#2D5016', // GREEN
      pending: '#C79C3F', // GOLD
      reject: '#8B0000', // DARK RED
      expired: '#D4522D', // RUST
      warning: '#FFB800', // YELLOW
      success: '#2D5016',
      error: '#8B0000',
      info: '#C79C3F',

      // Нейтральные
      gray: {
        50: '#F9F9F9',
        100: '#F0F0F0',
        200: '#E5E5E5',
        300: '#D0D0D0',
        400: '#B8B8B8',
        500: '#A0A0A0',
        600: '#808080',
        700: '#606060',
        800: '#404040',
        900: '#202020',
      },
    },

    fontFamily: {
      serif: ['Merriweather', 'Georgia', 'serif'],
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Courier New', 'monospace'],
    },

    fontSize: {
      xs: ['12px', '16px'],
      sm: ['14px', '20px'],
      base: ['16px', '24px'],
      lg: ['18px', '28px'],
      xl: ['20px', '28px'],
      '2xl': ['24px', '32px'],
      '3xl': ['30px', '38px'],
      '4xl': ['36px', '44px'],
    },

    extend: {
      boxShadow: {
        'stamp': '0 2px 8px rgba(44, 24, 16, 0.2)',
        'saloon-dark': '0 10px 30px rgba(76, 55, 40, 0.15)',
        'wood': '0 8px 20px rgba(76, 55, 40, 0.25)',
        'inset-light': 'inset 0 1px 3px rgba(76, 55, 40, 0.1)',
      },

      textShadow: {
        'saloon': '2px 2px 4px rgba(76, 55, 40, 0.3)',
        'glow': '0 0 10px rgba(255, 107, 53, 0.5)',
      },

      backgroundImage: {
        'paper-texture': 
          'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23F5E6D3%22 width=%22100%22 height=%22100%22/%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 /%3E%3C/filter%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23F5E6D3%22 filter=%22url(%23noise)%22 opacity=%220.4%22 /%3E%3C/svg%3E")',
        
        'wood-texture':
          'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%2220%22%3E%3Crect fill=%224A3728%22 width=%22200%22 height=%2220%22/%3E%3Crect fill=%22%236B5344%22 y=%220%22 width=%2210%22 height=%2220%22/%3E%3Crect fill=%22%236B5344%22 x=%2220%22 y=%220%22 width=%228%22 height=%2220%22/%3E%3C/svg%3E")',
      },

      animation: {
        'stamp-hit': 'stampHit 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'seal-pulse': 'sealPulse 2s ease-in-out infinite',
        'page-flip': 'pageFlip 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'ember-pulse': 'emberPulse 1.5s ease-in-out infinite',
        'ember-glow': 'emberGlow 2s ease-in-out infinite',
        'burn-effect': 'burnEffect 1s ease-out',
      },

      keyframes: {
        stampHit: {
          '0%': {
            transform: 'translateY(-20px) rotate(25deg)',
            opacity: '0',
          },
          '50%': {
            transform: 'translateY(0) rotate(0deg)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(5px) rotate(-5deg)',
            opacity: '0.8',
          },
        },

        sealPulse: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.6',
          },
          '50%': {
            transform: 'scale(1.1)',
            opacity: '1',
          },
        },

        pageFlip: {
          '0%': {
            transform: 'rotateY(90deg)',
            opacity: '0',
          },
          '50%': {
            transform: 'rotateY(45deg)',
            opacity: '0.5',
          },
          '100%': {
            transform: 'rotateY(0deg)',
            opacity: '1',
          },
        },

        emberPulse: {
          '0%, 100%': {
            opacity: '0.4',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.9',
            transform: 'scale(1.2)',
          },
        },

        emberGlow: {
          '0%': {
            boxShadow: '0 0 10px rgba(255, 107, 53, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(255, 107, 53, 0.8)',
          },
          '100%': {
            boxShadow: '0 0 10px rgba(255, 107, 53, 0.3)',
          },
        },

        burnEffect: {
          '0%': {
            backgroundColor: '#F5E6D3',
            boxShadow: 'inset 0 0 0 rgba(255, 107, 53, 0.5)',
          },
          '50%': {
            backgroundColor: '#EDD9C2',
            boxShadow: 'inset 0 0 20px rgba(255, 107, 53, 0.6)',
          },
          '100%': {
            backgroundColor: '#E8D7C3',
            boxShadow: 'inset 0 0 0 rgba(255, 107, 53, 0)',
          },
        },
      },

      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },

      spacing: {
        '128': '32rem',
        '144': '36rem',
      },

      borderRadius: {
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')(function ({ addUtilities }) {
      addUtilities({
        '.text-shadow-saloon': {
          textShadow: '2px 2px 4px rgba(76, 55, 40, 0.3)',
        },
        '.text-shadow-glow': {
          textShadow: '0 0 10px rgba(255, 107, 53, 0.5)',
        },
      });
    }),
  ],
};

export default config;
```

---

## 3️⃣ React Component: Полный DocumentCard

**Файл:** `src/components/documents/DocumentCard.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';

export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'expired';

interface DocumentCardProps {
  id: string;
  title: string;
  type: string;
  status: DocumentStatus;
  expiryDate?: Date;
  fileUrl?: string;
  reviewNotes?: string;
  onDownload?: () => void;
  onReupload?: () => void;
  onClick?: () => void;
}

const statusConfig: Record<DocumentStatus, {
  label: string;
  color: string;
  textColor: string;
  icon: string;
  borderColor: string;
  bgColor: string;
}> = {
  draft: {
    label: '✎ Черновик',
    color: 'bg-gray-400',
    textColor: 'text-white',
    icon: '✎',
    borderColor: 'border-gray-400',
    bgColor: 'bg-gray-100',
  },
  pending: {
    label: '⏳ На проверке',
    color: 'bg-pending',
    textColor: 'text-yellow-900',
    icon: '⏳',
    borderColor: 'border-pending',
    bgColor: 'bg-yellow-50',
  },
  approved: {
    label: '✓ Одобрено',
    color: 'bg-approve',
    textColor: 'text-white',
    icon: '✓',
    borderColor: 'border-approve',
    bgColor: 'bg-green-50',
  },
  active: {
    label: '★ Действительно',
    color: 'bg-approve',
    textColor: 'text-white',
    icon: '★',
    borderColor: 'border-approve',
    bgColor: 'bg-green-50',
  },
  rejected: {
    label: '✗ Отклонено',
    color: 'bg-reject',
    textColor: 'text-white',
    icon: '✗',
    borderColor: 'border-reject',
    bgColor: 'bg-red-50',
  },
  expired: {
    label: '⚠ Просроченно',
    color: 'bg-expired',
    textColor: 'text-white',
    icon: '⚠',
    borderColor: 'border-expired',
    bgColor: 'bg-orange-50',
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
  onClick,
}) => {
  const config = statusConfig[status];

  const daysUntilExpiry = expiryDate
    ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-parchment-200 border-2 ${config.borderColor}
        rounded-lg shadow-stamp hover:shadow-saloon-dark
        p-4 mb-4
        bg-paper-texture
        transition-all duration-300
        hover:scale-105 hover:-rotate-1
        cursor-pointer
      `}
    >
      {/* Деревянный верхний край */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-wood-800 bg-wood-texture flex justify-between px-3">
        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full shadow-md"></div>
        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full shadow-md"></div>
      </div>

      {/* Статус-индикатор (печать/звезда) */}
      <div
        className={`
          absolute top-3 right-3
          w-12 h-12 flex items-center justify-center
          text-2xl
          rounded-full
          font-bold
          opacity-80
          ${config.color}
          shadow-stamp
        `}
      >
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

        {/* Статус */}
        <div
          className={`
            inline-block px-3 py-1 rounded-full text-sm font-semibold
            mb-3
            ${config.color} ${config.textColor}
          `}
        >
          {config.label}
        </div>

        {/* Комментарий при отклонении */}
        {status === 'rejected' && reviewNotes && (
          <div className="bg-red-50 border-l-4 border-reject p-3 rounded mb-3">
            <p className="text-sm text-ink-800">
              <strong>Причина:</strong> {reviewNotes}
            </p>
          </div>
        )}

        {/* Дата истечения */}
        {expiryDate && (
          <p
            className={`
              text-sm font-semibold mb-3
              ${isExpiringSoon ? 'text-warning animate-pulse' : 'text-ink-600'}
            `}
          >
            📅 Действительно до: {expiryDate.toLocaleDateString('ru-RU')}
            {isExpiringSoon && ` (${daysUntilExpiry} дней)`}
          </p>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-2">
          {fileUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.();
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                onReupload?.();
              }}
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

---

## 4️⃣ React Component: Upload Zone

**Файл:** `src/components/documents/DocumentUploadZone.tsx`

```tsx
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      setSelectedFile(files[0]);
      onFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      setSelectedFile(files[0]);
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
      {/* Пульсирующие угли */}
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

        {selectedFile && (
          <p className="text-sm font-semibold text-approve mb-2">
            ✓ Файл: {selectedFile.name}
          </p>
        )}

        {/* Скрытый input */}
        <input
          type="file"
          className="hidden"
          id={`upload-${documentType}`}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleInputChange}
          disabled={isLoading}
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
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? '⏳ Загружается...' : 'Выбрать файл'}
        </label>
      </motion.div>

      {/* Деревянный край */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-wood-800"></div>
    </motion.div>
  );
};
```

---

## 5️⃣ CSS: Анимации в отдельном файле

**Файл:** `src/styles/animations.css`

```css
/* Stamp Hit Animation */
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
    box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 107, 53, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 53, 0);
  }
}

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

/* Utility Classes */
.stamp-hit {
  animation: stampHit 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

.stamp-glow {
  animation: stampGlow 1s ease-out;
}

.page-flip-enter {
  animation: pageFlip 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  perspective: 1000px;
}

.burn-effect {
  animation: burnEffect 1s ease-out;
}

.parchment-texture {
  background-color: #F5E6D3;
  background-image: 
    radial-gradient(ellipse at 20% 50%, rgba(255, 184, 128, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(139, 0, 0, 0.05) 0%, transparent 50%);
  background-size: 100% 100%, 100% 100%;
}

.paper-aged {
  background: #F5E6D3;
  position: relative;
}

.paper-aged::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 2px,
    rgba(139, 0, 0, 0.03) 2px,
    rgba(139, 0, 0, 0.03) 4px
  );
  pointer-events: none;
}

.wood-board {
  background: linear-gradient(90deg, #4A3728 0%, #6B5344 50%, #4A3728 100%);
  border-top: 3px solid #3D2E23;
  border-bottom: 3px solid #5C4A41;
  position: relative;
}

.wood-board::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0,
    transparent 10px,
    rgba(0, 0, 0, 0.1) 10px,
    rgba(0, 0, 0, 0.1) 20px
  );
  pointer-events: none;
}
```

---

## 6️⃣ NestJS Controller: API Endpoints

**Файл:** `backend/src/documents/documents.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Patch,
  UseInterceptors,
  UploadedFile,
  Param,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * POST /documents/upload/:employeeId/:documentTypeId
   * Загрузить документ (сотрудник)
   */
  @Post('upload/:employeeId/:documentTypeId')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: './uploads/documents',
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadDocument(
    @Param('employeeId') employeeId: string,
    @Param('documentTypeId') documentTypeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    return this.documentsService.uploadDocument(
      employeeId,
      documentTypeId,
      file,
    );
  }

  /**
   * GET /documents/my
   * Получить мои документы (сотрудник)
   */
  @Get('my')
  async getMyDocuments(@Req() req: any) {
    const employeeId = req.user.employeeId;
    return this.documentsService.getEmployeeDocuments(employeeId);
  }

  /**
   * GET /documents/employee/:employeeId
   * Получить документы сотрудника (админ)
   */
  @Get('employee/:employeeId')
  async getEmployeeDocuments(
    @Param('employeeId') employeeId: string,
    @Query('status') status?: string,
  ) {
    return this.documentsService.getEmployeeDocuments(employeeId, status);
  }

  /**
   * GET /documents/pending
   * Получить документы на проверку (админ)
   */
  @Get('pending')
  async getPendingDocuments(@Query('limit') limit = '50') {
    return this.documentsService.getPendingDocuments(parseInt(limit));
  }

  /**
   * GET /documents/expired
   * Получить просроченные документы (админ)
   */
  @Get('expired')
  async getExpiredDocuments() {
    return this.documentsService.getExpiredDocuments();
  }

  /**
   * PATCH /documents/:documentId/approve
   * Одобрить документ (админ)
   */
  @Patch(':documentId/approve')
  async approveDocument(
    @Param('documentId') documentId: string,
    @Body('notes') notes?: string,
    @Req() req?: any,
  ) {
    const adminId = req?.user?.id || 'SYSTEM';
    return this.documentsService.approveDocument(documentId, adminId, notes);
  }

  /**
   * PATCH /documents/:documentId/reject
   * Отклонить документ (админ)
   */
  @Patch(':documentId/reject')
  async rejectDocument(
    @Param('documentId') documentId: string,
    @Body('reason') reason: string,
    @Req() req?: any,
  ) {
    const adminId = req?.user?.id || 'SYSTEM';
    return this.documentsService.rejectDocument(documentId, adminId, reason);
  }
}
```

---

## 7️⃣ Хук для использования в React

**Файл:** `src/hooks/useDocumentUpload.ts`

```typescript
import { useState, useCallback } from 'react';

interface UploadOptions {
  onSuccess?: (document: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export const useDocumentUpload = (options?: UploadOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = useCallback(
    async (
      employeeId: string,
      documentTypeId: string,
      file: File,
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        // Валидация клиента
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
          throw new Error('Файл слишком большой (макс 10 МБ)');
        }

        const validTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
        ];
        if (!validTypes.includes(file.type)) {
          throw new Error('Недопустимый формат файла (PDF, JPG, PNG)');
        }

        // Загрузка
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        // Отслеживание прогресса
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            options?.onProgress?.(progress);
          }
        });

        // Обработка результата
        xhr.addEventListener('load', () => {
          if (xhr.status === 201) {
            const data = JSON.parse(xhr.responseText);
            setIsLoading(false);
            options?.onSuccess?.(data);
          } else {
            throw new Error(`Ошибка загрузки (${xhr.status})`);
          }
        });

        xhr.addEventListener('error', () => {
          const message = 'Ошибка сети';
          setError(message);
          options?.onError?.(message);
          setIsLoading(false);
        });

        const uploadUrl = `/api/documents/upload/${employeeId}/${documentTypeId}`;
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader(
          'Authorization',
          `Bearer ${localStorage.getItem('token')}`,
        );
        xhr.send(formData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setError(message);
        options?.onError?.(message);
        setIsLoading(false);
        throw err;
      }
    },
    [options],
  );

  return {
    uploadDocument,
    isLoading,
    error,
  };
};
```

---

## 8️⃣ Быстрый Чеклист для Имплементации

```markdown
## ✅ Чеклист: Документы 1.0

### DATABASE (1 день)
- [ ] Выполнить SQL миграцию
- [ ] Вставить базовые типы документов
- [ ] Проверить индексы
- [ ] Сид тестовых данных

### BACKEND (2 дня)
- [ ] DocumentsService + DocumentsController
- [ ] File upload обработчик
- [ ] Одобрение/отклонение документов
- [ ] SchedulerService для expiry sync
- [ ] Unit тесты

### FRONTEND (2 дня)
- [ ] DocumentCard компонент
- [ ] DocumentUploadZone компонент
- [ ] AdminDocumentDashboard
- [ ] IntegrationЫ с API
- [ ] Обработка ошибок

### STYLING & ANIMATIONS (1 день)
- [ ] Tailwind config
- [ ] Animations.css
- [ ] Пакет текстур
- [ ] Audio manager

### TESTING (1 день)
- [ ] E2E тесты загрузки
- [ ] Проверка валидации
- [ ] Shift blocking тесты
- [ ] Performance профилирование

---

**Всего:** ~7 дней на полную реализацию
```
