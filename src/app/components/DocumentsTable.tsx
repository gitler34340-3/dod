import React from 'react';
import { motion } from 'motion/react';

interface Document {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'completed';
  uploadedAt?: string;
  fileUrl?: string;
}

interface DocumentsTableProps {
  documents: Document[];
  onSelectDocument?: (doc: Document) => void;
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onSelectDocument,
}) => {
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

  return (
    <div className="overflow-x-auto rounded-lg shadow-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)' }}>
      <table className="
        w-full
      ">
        <thead>
          <tr className="font-serif font-bold" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
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
                className="border-b transition-colors"
                style={{ borderColor: 'var(--border-muted)' }}
              >
                <td className="p-4 font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                  {doc.employeeName}
                </td>
                <td className="p-4" style={{ color: 'var(--text-secondary)' }}>
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
                <td className="p-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {formatDate(doc.uploadedAt)}
                </td>
                <td className="
                  p-4 text-center
                ">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectDocument?.(doc)}
                    className="font-serif font-bold transition-colors text-base px-3 py-1 rounded-md"
                    style={{ color: 'var(--accent-primary)', border: '1px solid var(--border-muted)' }}
                  >
                    Проверить
                  </motion.button>
                </td>
              </motion.tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {documents.length === 0 && (
        <div className="p-8 text-center font-serif" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-4xl mb-2">✅</p>
          <p>Нет документов для проверки</p>
        </div>
      )}
    </div>
  );
};
