import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateWarrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Array<{ id: string; name: string }>;
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
  employees = [],
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    documentTypeId: '',
    deadline: '',
    priority: 'high' as 'high' | 'normal' | 'low',
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
      setFormData({
        employeeId: '',
        documentTypeId: '',
        deadline: '',
        priority: 'high' as 'high' | 'normal' | 'low',
        message: '',
      });
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

          {/* Modal */}
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
                dark:bg-[var(--bg-secondary)]
                rounded-lg shadow-2xl
                max-w-lg w-full
                p-8
                border-4 border-dashed border-ink-800
                dark:border-[var(--glass-border)]
                relative
              "
            >
              {/* Гвоздь */}
              <div className="
                absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                w-5 h-5 rounded-full bg-ink-800 shadow-lg
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
                  <select
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
                      text-ink-900
                      dark:bg-[var(--bg-primary)] dark:border-[var(--glass-border)]
                      font-serif focus:outline-none
                      focus:border-dodo-600
                    "
                    required
                  >
                    <option value="">Выберите сотрудника...</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
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
                      text-ink-900
                      dark:bg-[var(--bg-primary)] dark:border-[var(--glass-border)]
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
                      text-ink-900
                      dark:bg-[var(--bg-primary)] dark:border-[var(--glass-border)]
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
                  <div className="flex gap-2 text-ink-900">
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
                      text-ink-900
                      dark:bg-[var(--bg-primary)] dark:border-[var(--glass-border)]
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
                    dark:bg-[var(--glass-bg)] dark:text-[var(--text-primary)]
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
