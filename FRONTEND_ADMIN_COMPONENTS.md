# 👨‍💼 Frontend Администратора: Амбарная Книга
## Admin UI: Dashboard + Verification Screen + Warrant Modal

**Версия:** 1.0  
**Статус:** Ready to Implement  
**Tech Stack:** React 18+, Tailwind CSS 3+, Framer Motion, TypeScript

---

## 📋 Оглавление

1. [AdminDashboard (Главный дашборд)](#admin-dashboard)
2. [WANTEDSection (Красная зона)](#wanted-section)
3. [DocumentsTable (Таблица документов)](#documents-table)
4. [CreateWarrantModal (Модальное окно ордер)](#warrant-modal)
5. [VerificationScreen (Экран проверки)](#verification-screen)
6. [Integration Example](#integration-example)

---

## 📊 AdminDashboard

**Главный экран для администратора. Амбарная книга с тремя табами.**

```tsx
// src/components/AdminDashboard.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WANTEDSection } from './WANTEDSection';
import { DocumentsTable } from './DocumentsTable';
import { CreateWarrantModal } from './CreateWarrantModal';

interface AdminDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'completed';
  uploadedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  fileUrl?: string;
}

interface WantedEmployee {
  id: string;
  name: string;
  position: string;
  reason: string; // 'EXPIRED' | 'REJECTED' | 'MISSING'
  documentTypes: string[];
  severity: 'critical' | 'high' | 'normal';
  daysSinceIssue: number;
}

interface AdminDashboardProps {
  pendingDocuments: AdminDocument[];
  wantedEmployees: WantedEmployee[];
  onApproveDocument?: (docId: string, notes?: string) => Promise<void>;
  onRejectDocument?: (docId: string, reason: string) => Promise<void>;
  onCreateWarrant?: (data: any) => Promise<void>;
}

type TabType = 'pending' | 'approved' | 'wanted';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  pendingDocuments,
  wantedEmployees,
  onApproveDocument,
  onRejectDocument,
  onCreateWarrant,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [showWarrantModal, setShowWarrantModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AdminDocument | null>(null);

  const tabs = [
    { id: 'pending', label: '⏳ На проверке', count: pendingDocuments.length },
    { id: 'wanted', label: '🚨 WANTED', count: wantedEmployees.length },
  ] as const;

  return (
    <div className="
      min-h-screen
      bg-parchment-200
      p-4 md:p-8
    ">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="
          text-5xl md:text-6xl
          font-serif font-black
          text-ink-900
          mb-2
          tracking-wider
        ">
          📖 АМБАРНАЯ КНИГА
        </h1>
        <p className="
          text-lg text-sepia-600
          font-serif italic
        ">
          Реестр документов и сотрудников в блоке
        </p>
      </motion.div>

      {/* Кнопка создания ордера */}
      <div className="mb-8 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowWarrantModal(true)}
          className="
            bg-status-reject text-white
            px-6 py-3 rounded-lg
            font-serif font-bold
            border-2 border-status-reject
            shadow-lg hover:shadow-xl
            transition-all
          "
        >
          📬 Создать Ордер
        </motion.button>
      </div>

      {/* Табы */}
      <div className="
        flex gap-2 mb-8
        bg-parchment-100 p-3 rounded-lg
        border-l-4 border-wood-800
      ">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`
              relative px-6 py-3 rounded-lg
              font-serif font-bold
              transition-all duration-300
              ${
                activeTab === tab.id
                  ? 'bg-dodo-600 text-white shadow-lg'
                  : 'bg-white text-ink-800 border-2 border-ink-300 hover:border-dodo-600'
              }
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="
                ml-2 inline-block
                bg-status-reject text-white
                px-2 py-1 rounded-full
                text-xs font-black
              ">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="
                  absolute bottom-0 left-0 right-0
                  h-1 bg-white rounded-full
                "
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Контент табов */}
      <AnimatePresence mode="wait">
        {activeTab === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DocumentsTable
              documents={pendingDocuments}
              onApprove={onApproveDocument}
              onReject={onRejectDocument}
              onSelectDocument={setSelectedDocument}
            />
          </motion.div>
        )}

        {activeTab === 'wanted' && (
          <motion.div
            key="wanted"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WANTEDSection
              employees={wantedEmployees}
              onIssueWarrant={(employee) => {
                // Открыть модаль с предзаполненными данными сотрудника
                setShowWarrantModal(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно ордера */}
      {showWarrantModal && (
        <CreateWarrantModal
          isOpen={showWarrantModal}
          onClose={() => setShowWarrantModal(false)}
          onSubmit={onCreateWarrant}
        />
      )}

      {/* Экран верификации (если документ выбран) */}
      {selectedDocument && (
        <VerificationScreen
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onApprove={(notes) => {
            onApproveDocument?.(selectedDocument.id, notes);
            setSelectedDocument(null);
          }}
          onReject={(reason) => {
            onRejectDocument?.(selectedDocument.id, reason);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
};
```

---

## 🚨 WANTEDSection

**Красная зона: сотрудники без документов или с истекшими.**

```tsx
// src/components/WANTEDSection.tsx

import React from 'react';
import { motion } from 'framer-motion';

interface WantedEmployee {
  id: string;
  name: string;
  position: string;
  reason: string;
  documentTypes: string[];
  severity: 'critical' | 'high' | 'normal';
  daysSinceIssue: number;
}

interface WANTEDSectionProps {
  employees: WantedEmployee[];
  onIssueWarrant: (employee: WantedEmployee) => void;
}

export const WANTEDSection: React.FC<WANTEDSectionProps> = ({
  employees,
  onIssueWarrant,
}) => {
  const severityConfig = {
    critical: { color: 'bg-status-reject', label: '🚨 КРИТИЧНО', icon: '⛔' },
    high: { color: 'bg-status-expired', label: '⚠️ ВЫСОКИЙ', icon: '⚠️' },
    normal: { color: 'bg-status-pending', label: '📌 ОБЫЧНЫЙ', icon: '📌' },
  };

  return (
    <div>
      <div className="
        bg-status-reject text-white p-6 rounded-lg
        mb-8 border-4 border-status-reject
      ">
        <h2 className="
          text-3xl font-serif font-black
          mb-2
        ">
          🚨 РОЗЫСК ДЕШ ЛЮДЯМ
        </h2>
        <p className="
          font-serif italic
          opacity-90
        ">
          {employees.length} сотрудников (-ик) в списке розыска
        </p>
      </div>

      {/* Горизонтальный скролл карточек */}
      <div className="
        overflow-x-auto pb-4
        -mx-4 md:-mx-8 px-4 md:px-8
      ">
        <div className="
          flex gap-6
          min-w-min
        ">
          {employees.map((employee, index) => {
            const config = severityConfig[employee.severity];

            return (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="
                  flex-shrink-0 w-80
                  bg-white rounded-lg
                  border-4 border-status-reject
                  p-6
                  shadow-saloon-dark
                  hover:shadow-xl
                  transition-shadow
                "
              >
                {/* Статус серьёзности */}
                <div className={`
                  inline-block mb-4
                  px-4 py-2 rounded-full
                  ${config.color} text-white
                  font-serif font-bold text-sm
                `}>
                  {config.icon} {config.label}
                </div>

                {/* Имя */}
                <h3 className="
                  text-2xl font-serif font-black
                  text-ink-900 mb-1
                ">
                  {employee.name}
                </h3>

                {/* Должность */}
                <p className="
                  text-sm text-ink-600
                  font-serif mb-4
                ">
                  {employee.position}
                </p>

                {/* Прич */}
                <div className="
                  bg-parchment-100 p-3 rounded-lg
                  mb-4 border-l-4 border-status-reject
                ">
                  <p className="
                    text-xs font-serif text-ink-700
                  ">
                    <span className="font-bold">Причина:</span>{' '}
                    {employee.reason}
                  </p>
                  <p className="
                    text-xs font-serif text-ink-600 mt-1
                  ">
                    {employee.daysSinceIssue} дней в списке
                  </p>
                </div>

                {/* Документы */}
                <div className="mb-4">
                  <p className="
                    text-xs font-bold font-serif
                    text-ink-800 mb-2
                  ">
                    Требуемые документы:
                  </p>
                  <div className="
                    flex flex-wrap gap-2
                  ">
                    {employee.documentTypes.map((doc) => (
                      <span
                        key={doc}
                        className="
                          bg-status-reject text-white
                          text-xs px-3 py-1 rounded-full
                          font-serif font-bold
                        "
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Кнопка ордера */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onIssueWarrant(employee)}
                  className="
                    w-full
                    bg-status-reject text-white
                    px-4 py-2 rounded-lg
                    font-serif font-bold text-sm
                    hover:opacity-90
                    transition-opacity
                  "
                >
                  📬 Отправить Ордер
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

---

## 📋 DocumentsTable

**Таблица всех документов, ожидающих проверки.**

```tsx
// src/components/DocumentsTable.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Document {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'completed';
  uploadedAt?: string;
  reviewedAt?: string;
  fileUrl?: string;
}

interface DocumentsTableProps {
  documents: Document[];
  onApprove?: (docId: string, notes?: string) => Promise<void>;
  onReject?: (docId: string, reason: string) => Promise<void>;
  onSelectDocument?: (doc: Document) => void;
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onApprove,
  onReject,
  onSelectDocument,
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});

  const statusConfig = {
    pending: { label: '⏳ Ожидание', color: 'text-status-pending' },
    submitted: { label: '📤 Отправлено', color: 'text-status-pending' },
    approved: { label: '✅ Одобрено', color: 'text-status-approve' },
    rejected: { label: '❌ Отклонено', color: 'text-status-reject' },
    completed: { label: '✓ Завершено', color: 'text-status-approve' },
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
  };

  const rejectReasons = [
    'Размытое фото',
    'Не видно печати',
    'Истек срок',
    'Поддельный документ',
    'Неправильный документ',
    'Другое',
  ];

  return (
    <div className="
      overflow-x-auto
      bg-white rounded-lg shadow-lg
    ">
      <table className="
        w-full empty:p-0
      ">
        <thead>
          <tr className="
            bg-wood-800 text-white
            font-serif font-bold
          ">
            <th className="p-4 text-left">Сотрудник</th>
            <th className="p-4 text-left">Документ</th>
            <th className="p-4 text-left">Статус</th>
            <th className="p-4 text-left">Загружено</th>
            <th className="p-4 text-center">Действие</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, index) => (
            <React.Fragment key={doc.id}>
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="
                  border-b-2 border-dashed border-parchment-300
                  hover:bg-parchment-100
                  transition-colors
                "
              >
                <td className="
                  p-4 font-serif font-bold
                  text-ink-900
                ">
                  {doc.employeeName}
                </td>
                <td className="
                  p-4 text-ink-800
                ">
                  {doc.documentType}
                </td>
                <td className="p-4">
                  <span className={`
                    font-serif font-bold
                    ${statusConfig[doc.status].color}
                  `}>
                    {statusConfig[doc.status].label}
                  </span>
                </td>
                <td className="
                  p-4 text-sm text-ink-600
                ">
                  {formatDate(doc.uploadedAt)}
                </td>
                <td className="
                  p-4 text-center
                ">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setExpandedRow(expandedRow === doc.id ? null : doc.id);
                      onSelectDocument?.(doc);
                    }}
                    className="
                      text-dodo-600 font-serif font-bold
                      hover:text-dodo-700
                      transition-colors
                    "
                  >
                    {expandedRow === doc.id ? '−' : '+'}
                  </motion.button>
                </td>
              </motion.tr>

              {/* Expanded row */}
              {expandedRow === doc.id && (
                <motion.tr
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <td colSpan={5} className="
                    p-6 bg-parchment-50
                  ">
                    <div className="
                      space-y-4
                    ">
                      {/* Кнопки действия */}
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onApprove?.(doc.id)}
                          className="
                            bg-status-approve text-white
                            px-6 py-2 rounded-lg
                            font-serif font-bold
                            hover:opacity-90
                            transition-opacity
                          "
                        >
                          ✅ Одобрить
                        </motion.button>

                        <button
                          onClick={() =>
                            setRejectReason((prev) => ({
                              ...prev,
                              [doc.id]: prev[doc.id] ? '' : rejectReasons[0],
                            }))
                          }
                          className="
                            bg-status-reject text-white
                            px-6 py-2 rounded-lg
                            font-serif font-bold
                            hover:opacity-90
                            transition-opacity
                          "
                        >
                          ❌ Отклонить
                        </button>
                      </div>

                      {/* Причины отклонения */}
                      {rejectReason[doc.id] !== undefined && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="
                            bg-white p-4 rounded-lg
                            border-l-4 border-status-reject
                          "
                        >
                          <label className="
                            block text-sm font-serif font-bold
                            text-ink-900 mb-2
                          ">
                            Выберите причину отклонения:
                          </label>
                          <select
                            value={rejectReason[doc.id]}
                            onChange={(e) =>
                              setRejectReason((prev) => ({
                                ...prev,
                                [doc.id]: e.target.value,
                              }))
                            }
                            className="
                              w-full p-2 rounded-lg
                              border-2 border-ink-300
                              font-serif
                              mb-3
                            "
                          >
                            {rejectReasons.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              onReject?.(doc.id, rejectReason[doc.id]);
                              setRejectReason((prev) => ({
                                ...prev,
                                [doc.id]: undefined,
                              }));
                            }}
                            className="
                              w-full
                              bg-status-reject text-white
                              px-6 py-2 rounded-lg
                              font-serif font-bold
                              hover:opacity-90
                              transition-opacity
                            "
                          >
                            Отправить отклонение
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 📬 CreateWarrantModal

**Модальное окно (телеграмма) для создания ордера.**

```tsx
// src/components/CreateWarrantModal.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateWarrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    employeeId: string;
    documentTypeId: string;
    deadline: string;
    priority: 'high' | 'normal' | 'low';
    message: string;
  }) => Promise<void>;
}

export const CreateWarrantModal: React.FC<CreateWarrantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    documentTypeId: '',
    deadline: '',
    priority: 'high' as const,
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const documentTypes = [
    'Паспорт',
    'Медицинская книжка',
    'ДМС страховка',
    'Договор труда',
    'Справка санитарная',
    'СНИЛС',
    'ИНН',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="
              fixed inset-0 bg-black bg-opacity-50
              z-40
            "
          />

          {/* Modal (Телеграмма) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              p-4
            "
          >
            <motion.form
              onSubmit={handleSubmit}
              className="
                bg-parchment-200
                rounded-lg shadow-saloon-dark
                max-w-lg w-full
                p-8
                border-4 border-dashed border-ink-800
                relative
              "
            >
              {/* Закрепка (гвоздь) */}
              <div className="
                absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                w-4 h-4 rounded-full bg-ink-800 shadow-lg
              " />

              {/* Заголовок */}
              <h2 className="
                text-3xl font-serif font-black
                text-ink-900 mb-6
                text-center
              ">
                📬 СРОЧНЫЙ ОРДЕР
              </h2>

              {/* Форма */}
              <div className="space-y-4">
                {/* Сотрудник */}
                <div>
                  <label className="
                    block text-sm font-serif font-bold
                    text-ink-900 mb-2
                  ">
                    Сотрудник:
                  </label>
                  <input
                    type="text"
                    placeholder="Имя или ID сотрудника"
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        employeeId: e.target.value,
                      }))
                    }
                    className="
                      w-full p-3 rounded-lg
                      border-2 border-ink-300
                      font-serif focus:outline-none
                      focus:border-dodo-600
                    "
                    required
                  />
                </div>

                {/* Тип документа */}
                <div>
                  <label className="
                    block text-sm font-serif font-bold
                    text-ink-900 mb-2
                  ">
                    Документ:
                  </label>
                  <select
                    value={formData.documentTypeId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        documentTypeId: e.target.value,
                      }))
                    }
                    className="
                      w-full p-3 rounded-lg
                      border-2 border-ink-300
                      font-serif focus:outline-none
                      focus:border-dodo-600
                    "
                    required
                  >
                    <option value="">Выберите документ...</option>
                    {documentTypes.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Дедлайн */}
                <div>
                  <label className="
                    block text-sm font-serif font-bold
                    text-ink-900 mb-2
                  ">
                    Дедлайн:
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                    className="
                      w-full p-3 rounded-lg
                      border-2 border-ink-300
                      font-serif focus:outline-none
                      focus:border-dodo-600
                    "
                    required
                  />
                </div>

                {/* Приоритет */}
                <div>
                  <label className="
                    block text-sm font-serif font-bold
                    text-ink-900 mb-2
                  ">
                    Приоритет:
                  </label>
                  <div className="flex gap-2">
                    {(['high', 'normal', 'low'] as const).map((priority) => (
                      <label
                        key={priority}
                        className="
                          flex items-center gap-2
                          cursor-pointer
                        "
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={formData.priority === priority}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              priority: e.target.value as 'high' | 'normal' | 'low',
                            }))
                          }
                          className="cursor-pointer"
                        />
                        <span className="font-serif text-sm">
                          {priority === 'high' && '🚨 Высокий'}
                          {priority === 'normal' && '📌 Обычный'}
                          {priority === 'low' && '💤 Низкий'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Сообщение */}
                <div>
                  <label className="
                    block text-sm font-serif font-bold
                    text-ink-900 mb-2
                  ">
                    Сообщение:
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Напишите причину и инструкции..."
                    rows={4}
                    className="
                      w-full p-3 rounded-lg
                      border-2 border-ink-300
                      font-serif focus:outline-none
                      focus:border-dodo-600
                    "
                  />
                </div>
              </div>

              {/* Кнопки */}
              <div className="
                flex gap-3 mt-8
              ">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    flex-1
                    bg-status-reject text-white
                    px-6 py-3 rounded-lg
                    font-serif font-bold
                    hover:opacity-90 disabled:opacity-50
                    transition-opacity
                  "
                >
                  {isSubmitting ? '⏳ Отправляется...' : '📤 Отправить Ордер'}
                </motion.button>
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    flex-1
                    bg-ink-300 text-ink-900
                    px-6 py-3 rounded-lg
                    font-serif font-bold
                    hover:opacity-90
                    transition-opacity
                  "
                >
                  Отмена
                </button>
              </div>
            </motion.form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

---

## 🔍 VerificationScreen

**Экран проверки: сплит-скрин с документом и панелью инспектора.**

```tsx
// src/components/VerificationScreen.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Document {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  fileUrl?: string;
  uploadedAt?: string;
}

interface VerificationScreenProps {
  document: Document;
  onClose: () => void;
  onApprove: (notes?: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  document,
  onClose,
  onApprove,
  onReject,
}) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(approvalNotes);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(rejectionReason);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 bg-black z-50
        flex flex-col md:flex-row
      "
    >
      {/* Левая часть (60%): Просмотр документа */}
      <div className="
        flex-[600] flex flex-col items-center justify-center
        p-8 bg-ink-900
      ">
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4 md:top-8 md:right-8
            text-white hover:text-dodo-600
            transition-colors z-10
            font-serif font-bold text-xl
          "
        >
          ✕
        </button>

        {document.fileUrl ? (
          <div className="
            w-full h-full flex items-center justify-center
          ">
            {document.fileUrl.endsWith('.pdf') ? (
              <div className="
                text-center text-white
              ">
                <div className="text-6xl mb-4">📄</div>
                <p className="font-serif text-lg mb-4">
                  {document.documentType}
                </p>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    text-dodo-600 hover:text-dodo-500
                    font-serif font-bold
                    underline
                  "
                >
                  Открыть в новом окне
                </a>
              </div>
            ) : (
              <img
                src={document.fileUrl}
                alt={document.documentType}
                className="
                  max-w-full max-h-full
                  object-contain
                "
              />
            )}
          </div>
        ) : (
          <div className="text-center text-white">
            <div className="text-6xl mb-4">❓</div>
            <p className="font-serif">Файл не найден</p>
          </div>
        )}
      </div>

      {/* Правая часть (40%): Панель инспектора */}
      <motion.div
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        className="
          flex-[400] bg-parchment-200 p-8
          overflow-y-auto flex flex-col
        "
      >
        {/* Информация о сотруднике */}
        <div className="mb-8">
          <h2 className="
            text-2xl font-serif font-bold
            text-ink-900 mb-4
          ">
            👤 Информация
          </h2>
          <div className="
            space-y-3 bg-white p-4 rounded-lg
          ">
            <div>
              <p className="text-xs text-ink-600 font-serif">Сотрудник</p>
              <p className="text-lg font-serif font-bold text-ink-900">
                {document.employeeName}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-600 font-serif">Документ</p>
              <p className="text-lg font-serif font-bold text-ink-900">
                {document.documentType}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-600 font-serif">Загружено</p>
              <p className="text-sm font-serif text-ink-800">
                {document.uploadedAt
                  ? new Date(document.uploadedAt).toLocaleDateString('ru-RU')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Одобрение / Отклонение */}
        <div className="flex-1 space-y-4">
          {/* Одобрение */}
          <div>
            <label className="
              block text-sm font-serif font-bold
              text-ink-900 mb-2
            ">
              ✅ Одобрить с заметками (опционально):
            </label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Введите заметки о проверке..."
              rows={3}
              className="
                w-full p-3 rounded-lg
                border-2 border-status-approve
                font-serif text-sm
                focus:outline-none
                focus:border-status-approve
              "
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApprove}
              disabled={isApproving}
              className="
                w-full mt-3
                bg-status-approve text-white
                px-6 py-3 rounded-lg
                font-serif font-bold
                hover:opacity-90 disabled:opacity-50
                transition-opacity
              "
            >
              {isApproving ? '⏳ Одобряется...' : '✅ ОДОБРИТЬ'}
            </motion.button>
          </div>

          {/* Отклонение */}
          <div>
            <label className="
              block text-sm font-serif font-bold
              text-ink-900 mb-2
            ">
              ❌ Отклонить:
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Напишите причину отклонения..."
              rows={3}
              className="
                w-full p-3 rounded-lg
                border-2 border-status-reject
                font-serif text-sm
                focus:outline-none
                focus:border-status-reject
              "
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReject}
              disabled={isRejecting}
              className="
                w-full mt-3
                bg-status-reject text-white
                px-6 py-3 rounded-lg
                font-serif font-bold
                hover:opacity-90 disabled:opacity-50
                transition-opacity
              "
            >
              {isRejecting ? '⏳ Отклоняется...' : '❌ ОТКЛОНИТЬ'}
            </motion.button>
          </div>
        </div>

        {/* Закрыть */}
        <button
          onClick={onClose}
          className="
            w-full mt-6
            bg-ink-300 text-ink-900
            px-6 py-2 rounded-lg
            font-serif font-bold
            hover:opacity-90
            transition-opacity
          "
        >
          Закрыть
        </button>
      </motion.div>

      {/* Анимация одобрения (штамп) */}
      {isApproving && (
        <motion.div
          initial={{ scale: 3, opacity: 1, rotate: 45 }}
          animate={{ scale: 1, opacity: 0, rotate: 0 }}
          transition={{ duration: 0.6 }}
          className="
            fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            text-8xl z-40
            pointer-events-none
          "
        >
          ✅
        </motion.div>
      )}
    </motion.div>
  );
};
```

---

## 🔗 Integration Example

```tsx
// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { AdminDashboard } from '../components/AdminDashboard';

export function AdminPage() {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [wantedEmps, setWantedEmps] = useState([]);

  useEffect(() => {
    // Загрузить данные с бэкенда
    Promise.all([
      fetch('/api/documents/pending').then((res) => res.json()),
      fetch('/api/employees/wanted').then((res) => res.json()),
    ]).then(([docs, wanted]) => {
      setPendingDocs(docs);
      setWantedEmps(wanted);
    });
  }, []);

  return (
    <AdminDashboard
      pendingDocuments={pendingDocs}
      wantedEmployees={wantedEmps}
      onApproveDocument={async (docId, notes) => {
        const res = await fetch(`/api/documents/${docId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review_notes: notes }),
        });
        if (res.ok) {
          // Перезагрузить список
          location.reload();
        }
      }}
      onRejectDocument={async (docId, reason) => {
        const res = await fetch(`/api/documents/${docId}/reject`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review_notes: reason }),
        });
        if (res.ok) {
          location.reload();
        }
      }}
      onCreateWarrant={async (data) => {
        const res = await fetch('/api/document-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          location.reload();
        }
      }}
    />
  );
}
```

---

## ✅ Чеклист Имплементации

- [ ] `AdminDashboard.tsx` скопирована
- [ ] `WANTEDSection.tsx` скопирована
- [ ] `DocumentsTable.tsx` скопирована
- [ ] `CreateWarrantModal.tsx` скопирована
- [ ] `VerificationScreen.tsx` скопирована
- [ ] Все компоненты импортированы правильно
- [ ] Tailwind классы работают
- [ ] Framer Motion установлена
- [ ] API endpoints готовы
- [ ] Тестировано в браузере

---

**Версия:** 1.0  
**Статус:** ✅ Ready for Copy-Paste  
**Tech:** React 18+, Tailwind 3+, Framer Motion  
**Время имплементации:** 3-4 часа
