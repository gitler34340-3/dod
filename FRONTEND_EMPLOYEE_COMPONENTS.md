# 👨‍🍽️ Frontend Сотрудника: Полный UI Kit
## Employee UI: Хард-блок + Личный Кабинет + Дропзона

**Версия:** 1.0  
**Статус:** Ready to Implement  
**Tech Stack:** React 18+, Tailwind CSS 3+, Framer Motion, TypeScript

---

## 📋 Оглавление

1. [HardBlockScreen (Полноэкранный блок)](#hardblockscreem)
2. [EmployeeCabinet (Личный кабинет)](#employee-cabinet)
3. [DocumentCard (Карточка документа)](#document-card)
4. [DocumentUploadDropZone (Дропзона)](#upload-dropzone)
5. [Integration Example](#integration-example)

---

## 🚫 HardBlockScreen

**Когда:** Backend вернул 403 с флагом `missing_mandatory_doc`

**Что видит сотрудник:** Полноэкранный оверлей. Ничего больше.

```tsx
// src/components/HardBlockScreen.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface HardBlockScreenProps {
  documentName: string;
  reason: 'MISSING' | 'EXPIRED' | 'PENDING' | 'REJECTED';
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export const HardBlockScreen: React.FC<HardBlockScreenProps> = ({
  documentName,
  reason,
  onUpload,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const reasonTexts = {
    MISSING: 'ОТСУТСТВУЕТ',
    EXPIRED: 'ИСТЕКЛА',
    PENDING: 'НА ПРОВЕРКЕ',
    REJECTED: 'ОТКЛОНЕНА',
  };

  const reasonEmojis = {
    MISSING: '❌',
    EXPIRED: '⚠️',
    PENDING: '⏳',
    REJECTED: '❌',
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploadError(null);
      await onUpload(selectedFile);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Ошибка загрузки');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="
        fixed inset-0
        flex items-center justify-center
        bg-gradient-to-b from-wood-900 to-wood-800
        backdrop-blur-sm
        z-50
        p-4
      "
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.05) 0px,
            transparent 1px,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 3px
          )
        `,
      }}
    >
      {/* Плакат розыска */}
      <motion.div
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: -1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="
          relative
          bg-parchment-200
          border-4 border-dashed border-ink-800
          shadow-saloon-dark
          p-8 md:p-12
          max-w-md w-full
          transform -rotate-1
        "
      >
        {/* Рваные края (эффект старого плаката) */}
        <div className="absolute top-0 left-0 w-full h-2 bg-parchment-250 opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-parchment-250 opacity-50" />

        {/* Закрепка (гвоздь вверху посередине) */}
        <div className="
          absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-4 h-4 rounded-full bg-ink-800 shadow-lg
        " />

        {/* Основное содержимое */}
        <div className="text-center">
          {/* Заголовок-крик */}
          <div className="mb-6">
            <h1 className="
              text-4xl md:text-5xl
              font-serif font-black
              text-ink-900
              mb-2
              tracking-wider
              text-shadow-saloon
            ">
              ДОСТУП ЗАКРЫТ
            </h1>
            <p className="
              text-lg md:text-xl
              font-serif
              text-ink-800
              font-bold
              italic
            ">
              РАЗЫСКИВАЕТСЯ:
            </p>
          </div>

          {/* Название документа (как в розыске) */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="
              my-8
              p-6
              bg-parchment-150
              border-2 border-dashed border-ink-600
              rounded-sm
            "
          >
            <div className="text-5xl mb-3">{reasonEmojis[reason]}</div>
            <p className="
              text-3xl md:text-4xl
              font-serif font-black
              text-ink-900
              mb-2
            ">
              {documentName.toUpperCase()}
            </p>
            <p className="
              text-sm md:text-base
              font-serif
              text-ink-700
              tracking-wider
            ">
              СТАТУС: {reasonTexts[reason]}
            </p>
          </motion.div>

          {/* Основное сообщение */}
          <p className="
            text-base md:text-lg
            font-serif
            text-ink-800
            mb-8
            leading-relaxed
            bg-sepia-50 p-4 rounded-sm
          ">
            Без этого документа вы не можете пользоваться приложением.
            <br />
            <span className="font-bold">Загрузите скан немедленно.</span>
          </p>

          {/* Зона загрузки файла */}
          <label className="
            block
            border-3 border-dashed border-dodo-600
            rounded-lg p-8
            cursor-pointer
            bg-gradient-to-b from-dodo-50 to-transparent
            hover:bg-dodo-100
            transition-all duration-300
            mb-6
          ">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                if (e.target.files?.length) {
                  setSelectedFile(e.target.files[0]);
                  setUploadError(null);
                }
              }}
              disabled={isLoading}
              className="hidden"
            />
            <div className="text-center">
              <div className="text-5xl mb-3">📄</div>
              <p className="
                text-lg font-bold
                text-ink-900 font-serif
                mb-1
              ">
                {selectedFile ? selectedFile.name : 'Выберите файл'}
              </p>
              <p className="
                text-sm text-ink-600
                font-serif
              ">
                PDF, JPG, PNG до 10 МБ
              </p>
            </div>
          </label>

          {/* Ошибка загрузки (если есть) */}
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                mb-6 p-4 rounded-lg
                bg-status-reject text-white
                text-sm font-serif
              "
            >
              {uploadError}
            </motion.div>
          )}

          {/* Кнопка загрузки (ОГРОМНАЯ, оранжевая) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="
              w-full
              bg-gradient-to-b from-dodo-600 to-dodo-700
              text-white
              px-8 py-4 md:py-5
              rounded-lg
              font-serif font-black text-lg md:text-xl
              border-3 border-dodo-800
              shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              uppercase
              tracking-wider
              transform hover:translate-y-[-2px]
            "
          >
            {isLoading ? (
              <>⏳ Загружается...</>
            ) : (
              <>📤 Загрузить скан</>
            )}
          </motion.button>

          {/* Подсказка */}
          <p className="
            text-xs text-ink-500 mt-6
            font-mono
          ">
            После загрузки администратор проверит документ в течение 24 часов.
          </p>
        </div>

        {/* Печати по углам (декорация) */}
        <div className="
          absolute top-4 right-4
          text-4xl opacity-20 transform rotate-12
        ">
          ⚠️
        </div>
        <div className="
          absolute bottom-4 left-4
          text-4xl opacity-20 transform -rotate-12
        ">
          ⚠️
        </div>
      </motion.div>
    </motion.div>
  );
};
```

---

## 📋 EmployeeCabinet

**Когда:** Сотрудник прошел гейткипер. Все документы в порядке.

**Что предвидит:** Доска объявлений с карточками документов.

```tsx
// src/components/EmployeeCabinet.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DocumentCard } from './DocumentCard';

interface Document {
  id: string;
  title: string;
  status: 'active' | 'approved' | 'pending' | 'rejected' | 'expired';
  issuedDate: string;
  expiryDate: string;
  fileUrl?: string;
}

interface EmployeeCabinetProps {
  documents: Document[];
  onUploadClick?: () => void;
  onDownloadClick?: (docId: string) => void;
}

export const EmployeeCabinet: React.FC<EmployeeCabinetProps> = ({
  documents,
  onUploadClick,
  onDownloadClick,
}) => {
  const [filteredDocs, setFilteredDocs] = useState<Document[]>(documents);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'expired'>(
    'all'
  );

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredDocs(documents);
    } else {
      setFilteredDocs(documents.filter((doc) => doc.status === filterStatus));
    }
  }, [filterStatus, documents]);

  return (
    <div className="
      min-h-screen
      bg-parchment-200
      p-4 md:p-8
    ">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="
          text-4xl md:text-5xl
          font-serif font-black
          text-ink-900
          mb-2
        ">
          📋 Мои Документы
        </h1>
        <p className="
          text-lg text-ink-600
          font-serif
        ">
          Здесь хранятся все ваши документы. Следите за их сроком действия.
        </p>
      </motion.div>

      {/* Фильтры */}
      <div className="
        flex flex-wrap gap-3 mb-8
        bg-parchment-150 p-4 rounded-lg
        border-l-4 border-wood-800
      ">
        {(['all', 'active', 'pending', 'expired'] as const).map((status) => (
          <motion.button
            key={status}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterStatus(status)}
            className={`
              px-4 py-2 rounded-lg font-serif font-bold
              transition-all duration-200
              ${
                filterStatus === status
                  ? 'bg-dodo-600 text-white shadow-lg'
                  : 'bg-white text-ink-800 border-2 border-ink-300 hover:border-dodo-600'
              }
            `}
          >
            {status === 'all' && '📊 Все'}
            {status === 'active' && '✅ Активные'}
            {status === 'pending' && '⏳ На проверке'}
            {status === 'expired' && '⚠️ Истёкшие'}
          </motion.button>
        ))}
      </div>

      {/* Сетка документов */}
      <motion.div
        layout
        className="
          grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
          mb-8
        "
      >
        {filteredDocs.map((doc, index) => (
          <motion.div
            key={doc.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: index * 0.05 }}
          >
            <DocumentCard
              {...doc}
              onDownload={() => onDownloadClick?.(doc.id)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Зона загрузки нового документа */}
      {onUploadClick && (
        <div className="
          mt-12 pt-8 border-t-2 border-dashed border-ink-300
        ">
          <h2 className="
            text-2xl font-serif font-bold
            text-ink-900 mb-6
          ">
            📤 Загрузить Новый Документ
          </h2>
          <DocumentUploadDropZone onUpload={onUploadClick} />
        </div>
      )}

      {/* Footer напоминание */}
      <div className="
        mt-12
        bg-sepia-100 text-sepia-900
        p-6 rounded-lg border-l-4 border-sepia-500
      ">
        <p className="font-serif text-sm">
          <strong>💡 Совет:</strong> Следите за датой истечения документов.
          Если документ истекает менее чем в 7 дней, мы пришлём уведомление.
          Не забывайте обновлять документы вовремя!
        </p>
      </div>
    </div>
  );
};
```

---

## 🏷️ DocumentCard

**Одна карточка документа на доске.**

```tsx
// src/components/DocumentCard.tsx

import React from 'react';
import { motion } from 'framer-motion';

interface DocumentCardProps {
  id: string;
  title: string;
  status: 'active' | 'approved' | 'pending' | 'rejected' | 'expired';
  issuedDate: string;
  expiryDate: string;
  onDownload?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  title,
  status,
  issuedDate,
  expiryDate,
  onDownload,
}) => {
  // Определить цвет и иконку статуса
  const statusConfig = {
    active: {
      icon: '✅',
      label: 'Активен',
      color: 'bg-status-approve',
      textColor: 'text-status-approve',
      badge: '🟢',
    },
    approved: {
      icon: '✨',
      label: 'Одобрен',
      color: 'bg-status-approve',
      textColor: 'text-status-approve',
      badge: '⭐',
    },
    pending: {
      icon: '⏳',
      label: 'На проверке',
      color: 'bg-status-pending',
      textColor: 'text-status-pending',
      badge: '⏳',
    },
    rejected: {
      icon: '❌',
      label: 'Отклонён',
      color: 'bg-status-reject',
      textColor: 'text-status-reject',
      badge: '⛔',
    },
    expired: {
      icon: '⚠️',
      label: 'Истёк',
      color: 'bg-status-expired',
      textColor: 'text-status-expired',
      badge: '⚠️',
    },
  };

  const config = statusConfig[status];

  // Парсить дату
  const parseDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Дни до истечения
  const daysUntilExpiry = Math.ceil(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 7;

  return (
    <motion.div
      whileHover={{ scale: 1.02, rotate: 1 }}
      className="
        relative
        bg-white
        p-6 rounded-lg
        shadow-lg hover:shadow-xl
        border-l-4 border-wood-800
        transition-all duration-300
      "
    >
      {/* Гвоздь вверху (декорация через ::before) */}
      <div className="
        absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        w-3 h-3 rounded-full bg-ink-900 shadow-md
      " />

      {/* Красная линия если скоро истекает */}
      {isExpiringSoon && (
        <div className="
          absolute top-0 left-0 right-0
          h-1 bg-gradient-to-r from-status-expired to-transparent
        " />
      )}

      {/* Título документа */}
      <h3 className="
        text-xl font-serif font-bold
        text-ink-900 mb-3
      ">
        {title}
      </h3>

      {/* Статус: печать */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className={`
          inline-block
          px-4 py-2 rounded-full
          ${config.color} text-white
          font-serif font-bold text-sm
          mb-4
        `}
      >
        {config.badge} {config.label}
      </motion.div>

      {/* Даты */}
      <div className="
        space-y-2 mb-4
        text-sm text-ink-700 font-serif
      ">
        <p>
          <span className="font-bold">Выдано:</span> {parseDate(issuedDate)}
        </p>
        <p className={isExpiringSoon ? 'text-status-expired font-bold' : ''}>
          <span className="font-bold">Действует до:</span> {parseDate(expiryDate)}
          {daysUntilExpiry >= 0 && (
            <span className="ml-2">
              ({daysUntilExpiry === 0 ? 'сегодня' : `через ${daysUntilExpiry} дней`})
            </span>
          )}
        </p>
      </div>

      {/* Предупреждение если скоро истекает */}
      {isExpiringSoon && (
        <div className="
          bg-status-expired bg-opacity-10
          border-l-4 border-status-expired
          p-3 mb-4 rounded-sm
        ">
          <p className="text-xs text-status-expired font-bold font-serif">
            ⚠️ Документ скоро истечёт! Обновите его.
          </p>
        </div>
      )}

      {/* Кнопки действия */}
      <div className="
        flex gap-2
        pt-4 border-t border-parchment-300
      ">
        {onDownload && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDownload}
            className="
              flex-1
              bg-dodo-600 text-white
              px-4 py-2 rounded-lg
              font-serif font-bold text-sm
              hover:bg-dodo-700
              transition-colors
            "
          >
            📥 Скачать
          </motion.button>
        )}
        {status === 'rejected' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="
              flex-1
              bg-status-reject text-white
              px-4 py-2 rounded-lg
              font-serif font-bold text-sm
              hover:opacity-90
              transition-opacity
            "
          >
            🔄 Загрузить заново
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
```

---

## 📤 DocumentUploadDropZone

**Красивая дропзона с пульсирующим эффектом.**

```tsx
// src/components/DocumentUploadDropZone.tsx

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface DocumentUploadDropZoneProps {
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export const DocumentUploadDropZone: React.FC<DocumentUploadDropZoneProps> = ({
  onUpload,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploadProgress(0);
      // Имитировать прогресс загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 100);

      await onUpload(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Сбросить после успеха
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
    }
  };

  return (
    <div className="
      w-full max-w-2xl mx-auto
    ">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? '#FF6B35' : '#D4C4B0',
          backgroundColor: isDragging ? 'rgba(255, 107, 53, 0.05)' : 'rgba(245, 230, 211, 0.3)',
        }}
        className="
          relative
          border-3 border-dashed border-parchment-400
          rounded-xl p-12
          text-center
          cursor-pointer
          transition-all duration-300
          overflow-hidden
        "
      >
        {/* Ember particles (пульсирующий эффект) */}
        {isDragging && (
          <>
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 5px rgba(255, 107, 53, 0.3)',
                  '0 0 20px rgba(255, 107, 53, 0.8)',
                  '0 0 5px rgba(255, 107, 53, 0.3)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="
                absolute top-4 left-1/4
                w-2 h-2 rounded-full bg-dodo-600
              "
            />
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 5px rgba(255, 107, 53, 0.3)',
                  '0 0 20px rgba(255, 107, 53, 0.8)',
                  '0 0 5px rgba(255, 107, 53, 0.3)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
              className="
                absolute top-8 right-1/4
                w-2 h-2 rounded-full bg-dodo-600
              "
            />
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 5px rgba(255, 107, 53, 0.3)',
                  '0 0 20px rgba(255, 107, 53, 0.8)',
                  '0 0 5px rgba(255, 107, 53, 0.3)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }}
              className="
                absolute bottom-4 right-1/3
                w-2 h-2 rounded-full bg-dodo-600
              "
            />
          </>
        )}

        {/* Основной контент */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileInput}
          className="hidden"
          disabled={isLoading}
        />

        {selectedFile && uploadProgress < 100 ? (
          // Статус загрузки
          <div className="space-y-4">
            <div className="text-5xl">📤</div>
            <p className="text-lg font-serif font-bold text-ink-900">
              {selectedFile.name}
            </p>
            <div className="
              w-full bg-parchment-300 rounded-full h-3
              overflow-hidden
            ">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="
                  h-full bg-gradient-to-r
                  from-dodo-600 to-dodo-500
                "
              />
            </div>
            <p className="text-sm text-ink-600 font-serif">
              {uploadProgress}% загружено...
            </p>
          </div>
        ) : uploadProgress === 100 ? (
          // Успех
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="space-y-4"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="text-6xl"
            >
              ✅
            </motion.div>
            <p className="text-lg font-serif font-bold text-status-approve">
              Файл успешно загружен!
            </p>
          </motion.div>
        ) : (
          // Начальное состояние
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="space-y-4"
          >
            <div className="text-5xl">
              {isDragging ? '✨' : '📁'}
            </div>
            <div>
              <p className="text-xl font-serif font-bold text-ink-900 mb-2">
                {isDragging ? 'Отпустите файл здесь' : 'Перетащите файл сюда'}
              </p>
              <p className="text-sm text-ink-600 font-serif">
                или нажмите, чтобы выбрать
              </p>
            </div>
            <p className="text-xs text-ink-500 font-mono mt-4">
              PDF, JPG, PNG до 10 МБ
            </p>
          </motion.div>
        )}

        {/* Кнопка загрузки */}
        {selectedFile && uploadProgress === 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUpload}
            disabled={isLoading}
            className="
              mt-6
              bg-dodo-600 text-white
              px-8 py-3 rounded-lg
              font-serif font-bold
              hover:bg-dodo-700
              disabled:opacity-50
              transition-all
            "
          >
            {isLoading ? '⏳ Загружается...' : '📤 Загрузить'}
          </motion.button>
        )}

        {/* Кнопка выбрать файл (если ничего не выбрано) */}
        {!selectedFile && uploadProgress === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="
              mt-6
              bg-dodo-600 text-white
              px-8 py-3 rounded-lg
              font-serif font-bold
              hover:bg-dodo-700
              transition-all
            "
          >
            📂 Выбрать файл
          </button>
        )}
      </motion.div>
    </div>
  );
};
```

---

## 🔗 Integration Example

**Как интегрировать в основное приложение:**

```tsx
// src/App.tsx

import React, { useState, useContext } from 'react';
import { GatekeeperContext } from './contexts/GatekeeperContext';
import { HardBlockScreen } from './components/HardBlockScreen';
import { EmployeeCabinet } from './components/EmployeeCabinet';

export function EmployeeApp() {
  const gatekeeperContext = useContext(GatekeeperContext);
  const [documents, setDocuments] = useState([
    {
      id: '1',
      title: 'Паспорт',
      status: 'active' as const,
      issuedDate: '2015-06-15',
      expiryDate: '2025-06-15',
      fileUrl: '/documents/passport.pdf',
    },
    {
      id: '2',
      title: 'Медицинская книжка',
      status: 'pending' as const,
      issuedDate: '2023-03-10',
      expiryDate: '2026-03-10',
    },
  ]);

  const handleUpload = async (file: File) => {
    // Отправить на backend
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      // Успех!
      gatekeeperContext.setBlocked({ blocked: false });
    }
  };

  // Если гейткипер заблокировал доступ
  if (gatekeeperContext.state.blocked) {
    return (
      <HardBlockScreen
        documentName={gatekeeperContext.state.documentName || 'Документ'}
        reason={gatekeeperContext.state.reason || 'MISSING'}
        onUpload={handleUpload}
      />
    );
  }

  // Иначе показывать кабинет
  return (
    <EmployeeCabinet
      documents={documents}
      onDownloadClick={(docId) => {
        // Скачать документ
        window.open(`/api/documents/${docId}/download`, '_blank');
      }}
    />
  );
}

export default EmployeeApp;
```

---

## 🎨 Tailwind Classes Reference

**Копировать эти классы в tailwind.config.ts:**

```typescript
// Уже добавлены в DOCUMENTS_COLOR_AND_ANIMATIONS.md
// Используй эти основные цвета:

// Text
text-ink-800    // Dark text
text-ink-600    // Secondary text
text-ink-900    // Very dark

// Background
bg-parchment-200    // Main background
bg-parchment-150    // Light variant

// Accents
bg-dodo-600     // Orange button
bg-status-approve   // Green
bg-status-pending   // Gold
bg-status-reject    // Red
bg-status-expired   // Rust orange

// Borders
border-wood-800     // Dark wood
border-ink-300      // Light text border

// Shadows
shadow-saloon-dark  // Deep shadow
shadow-lg           // Light shadow
```

---

## 📱 Responsive Notes

- **Mobile優先:** Все компоненты адаптируются на мобайл
- **Grid:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Typography:** Text size уменьшается на мобайл (md:text-5xl → text-4xl)
- **Padding:** `p-4 md:p-8` для адаптивных отступов

---

## ✅ Чеклист Имплементации

- [ ] `HardBlockScreen.tsx` скопирована
- [ ] `EmployeeCabinet.tsx` скопирована
- [ ] `DocumentCard.tsx` скопирована
- [ ] `DocumentUploadDropZone.tsx` скопирована
- [ ] Tailwind config обновлена с цветами
- [ ] Framer Motion установлена (`npm i framer-motion`)
- [ ] GatekeeperContext интегрирована (из DOCUMENTS_GATEKEEPER_INTEGRATION.md)
- [ ] API endpoints готовы (`/api/documents/upload`, `/api/documents/:id/download`)
- [ ] Тестировано в браузере

---

**Версия:** 1.0  
**Статус:** ✅ Ready for Copy-Paste  
**Tech:** React 18+, Tailwind 3+, Framer Motion  
**Время имплементации:** 2-3 часа
