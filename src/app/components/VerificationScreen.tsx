import React, { useState } from 'react';
import { motion } from 'motion/react';

interface Document {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  fileUrl?: string;
  uploadedAt?: string;
  status?: string;
  notes?: string;
  fileName?: string;
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
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

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

  const openPreview = () => {
    if (!document.fileUrl) return;
    setIsPreviewFullscreen(true);
  };

  const historyRows = (document.notes || '')
    .split('\n')
    .filter((line) => line.includes('[HISTORY'));

  return (
    <>
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 z-50
        flex flex-col md:flex-row
      "
      style={{ background: 'var(--bg-overlay)' }}
    >
      {/* Кнопка закрытия */}
      <button
        onClick={onClose}
        className="
          absolute top-4 right-4 md:top-8 md:right-8
          hover:opacity-90
          transition-colors z-10
          font-serif font-bold text-2xl
          p-2 rounded-full
        "
        style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)' }}
      >
        ✕
      </button>

      {/* Левая часть (60%): Просмотр документа */}
      <div className="
        flex-[600] flex flex-col items-center justify-center
        p-8
        min-h-screen md:min-h-0
      " style={{ background: 'var(--bg-secondary)' }}>
        {document.fileUrl ? (
          <div className="
            w-full h-full flex items-center justify-center
          ">
            {document.fileUrl.endsWith('.pdf') ? (
              <div className="text-center" style={{ color: 'var(--text-primary)' }}>
                <div className="text-8xl mb-4">📄</div>
                <p className="font-serif text-xl mb-4">
                  {document.documentType}
                </p>
                <button
                  onClick={openPreview}
                  className="font-serif font-bold underline text-lg"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Открыть в полноэкранном режиме
                </button>
              </div>
            ) : (
              <button onClick={openPreview} className="w-full h-full flex items-center justify-center">
                <img
                  src={document.fileUrl}
                  alt={document.documentType}
                  className="max-w-full max-h-full object-contain"
                />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center" style={{ color: 'var(--text-primary)' }}>
            <div className="text-8xl mb-4">❓</div>
            <p className="font-serif text-xl">Файл не найден</p>
          </div>
        )}
      </div>

      {/* Правая часть (40%): Панель инспектора */}
      <motion.div
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        className="
          flex-[400] p-8
          overflow-y-auto flex flex-col
          min-h-screen md:min-h-0
        " style={{ background: 'var(--bg-elevated)' }}
      >
        {/* Информация о сотруднике */}
        <div className="mb-8">
          <h2 className="text-2xl font-serif font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            👤 Информация
          </h2>
          <div className="space-y-3 p-4 rounded-lg border-l-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent-primary)' }}>
            <div>
              <p className="text-xs font-serif font-bold" style={{ color: 'var(--text-tertiary)' }}>Сотрудник</p>
              <p className="text-lg font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                {document.employeeName}
              </p>
            </div>
            <div>
              <p className="text-xs font-serif font-bold" style={{ color: 'var(--text-tertiary)' }}>Документ</p>
              <p className="text-lg font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                {document.documentType}
              </p>
            </div>
            <div>
              <p className="text-xs font-serif font-bold" style={{ color: 'var(--text-tertiary)' }}>Загружено</p>
              <p className="text-sm font-serif" style={{ color: 'var(--text-secondary)' }}>
                {document.uploadedAt
                  ? new Date(document.uploadedAt).toLocaleDateString('ru-RU')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Действия */}
        <div className="flex-1 space-y-4">
          {historyRows.length > 0 && (
            <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--border-muted)', background: 'var(--bg-secondary)' }}>
              <p className="font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>История</p>
              <div className="space-y-2 max-h-36 overflow-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
                {historyRows.map((row, idx) => (
                  <div key={`${row}-${idx}`}>{row}</div>
                ))}
              </div>
            </div>
          )}
          {/* Одобрение */}
          <div>
            <label className="block text-sm font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              ✅ Одобрить с заметками:
            </label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Введите заметки о проверке..."
              rows={3}
              className="
                w-full p-3 rounded-lg
                border-2
                font-serif text-sm
                focus:outline-none
              "
              style={{ borderColor: 'var(--status-confirmed)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full mt-3 px-6 py-3 rounded-lg font-serif font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: 'var(--status-confirmed)', color: '#fff' }}
            >
              {isApproving ? '⏳ Одобряется...' : '✅ ОДОБРИТЬ'}
            </motion.button>
          </div>

          {/* Отклонение */}
          <div>
            <label className="block text-sm font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              ❌ Отклонить:
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Напишите причину отклонения..."
              rows={3}
              className="
                w-full p-3 rounded-lg
                border-2
                font-serif text-sm
                focus:outline-none
              "
              style={{ borderColor: 'var(--status-rejected)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="w-full mt-3 px-6 py-3 rounded-lg font-serif font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: 'var(--status-rejected)', color: '#fff' }}
            >
              {isRejecting ? '⏳ Отклоняется...' : '❌ ОТКЛОНИТЬ'}
            </motion.button>
          </div>
        </div>

        {/* Закрыть */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-2 rounded-lg font-serif font-bold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-muted)' }}
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
            text-9xl z-40
            pointer-events-none
            font-serif font-black
          "
          style={{
            color: '#2d5016',
            textShadow: '0 0 20px rgba(45, 80, 22, 0.5)',
          }}
        >
          ✅
        </motion.div>
      )}
      </motion.div>
      {isPreviewFullscreen && document.fileUrl && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.9)' }}
        onClick={() => setIsPreviewFullscreen(false)}
      >
        <button
          onClick={() => setIsPreviewFullscreen(false)}
          className="absolute top-4 right-4 px-3 py-1 rounded"
          style={{ background: '#fff', color: '#000' }}
        >
          Закрыть
        </button>
        {document.fileUrl.endsWith('.pdf') ? (
          <iframe
            src={document.fileUrl}
            className="w-full h-full rounded"
            title={document.fileName || document.documentType}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={document.fileUrl}
            alt={document.documentType}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        </motion.div>
      )}
    </>
  );
};
