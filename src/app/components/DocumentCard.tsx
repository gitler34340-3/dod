import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface DocumentCardProps {
  id: string;
  title: string;
  status: 'active' | 'approved' | 'pending' | 'rejected' | 'expired';
  issuedDate: string;
  expiryDate: string;
  onDownload?: () => void;
  onReupload?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  id,
  title,
  status,
  issuedDate,
  expiryDate,
  onDownload,
  onReupload,
}) => {
  const statusConfig = {
    active: { emoji: '✅', label: 'Активен', color: 'bg-status-approve', badge: 'bg-status-approve' },
    approved: { emoji: '✨', label: 'Одобрен', color: 'bg-status-approve', badge: 'bg-status-approve' },
    pending: { emoji: '⏳', label: 'На проверке', color: 'bg-status-pending', badge: 'bg-status-pending' },
    rejected: { emoji: '❌', label: 'Отклонён', color: 'bg-status-reject', badge: 'bg-status-reject' },
    expired: { emoji: '⚠️', label: 'Истёк', color: 'bg-status-expired', badge: 'bg-status-expired' },
  };

  const config = statusConfig[status];

  const daysRemaining = useMemo(() => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [expiryDate]);

  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="
        relative
        bg-white rounded-lg
        shadow-lg hover:shadow-xl
        border-l-4 border-wood-800
        p-6
        transition-all
      "
    >
      {/* Nail decoration */}
      <div className="
        absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        w-3 h-3 rounded-full bg-ink-900 shadow-md
      " />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="
          text-lg font-serif font-bold
          text-ink-900 flex-1
        ">
          {title}
        </h3>

        {/* Status Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
          className="
            flex-shrink-0 ml-2
            w-10 h-10 rounded-full
            flex items-center justify-center
            text-white font-bold text-lg
            shadow-md
            animate-seal-pulse
          "
          style={{
            backgroundColor: config.badge === 'bg-status-approve' ? '#2d5016' :
                           config.badge === 'bg-status-pending' ? '#c79c3f' :
                           config.badge === 'bg-status-reject' ? '#8b0000' :
                           '#d4522d',
          }}
        >
          {config.emoji}
        </motion.div>
      </div>

      {/* Status */}
      <p className="
        text-sm font-serif font-bold
        text-sepia-700 mb-4
      ">
        {config.label}
      </p>

      {/* Dates */}
      <div className="
        space-y-2 mb-4
        pb-4 border-b border-parchment-300
      ">
        <div className="text-xs text-ink-700 font-serif">
          <span className="font-bold">Выдано:</span>{' '}
          {formatDate(issuedDate)}
        </div>
        <div className="text-xs text-ink-700 font-serif">
          <span className="font-bold">Действует до:</span>{' '}
          {formatDate(expiryDate)}
          {daysRemaining > 0 && (
            <span className="text-sepia-600 ml-2">
              ({daysRemaining} дн.)
            </span>
          )}
        </div>
      </div>

      {/* Warning */}
      {isExpiringSoon && status === 'active' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            bg-status-expired bg-opacity-20
            border-l-4 border-status-expired
            p-3 mb-4 rounded
          "
        >
          <p className="text-xs font-serif font-bold text-status-expired">
            ⚠️ Истекает через {daysRemaining} {daysRemaining === 1 ? 'день' : 'дней'}!
          </p>
        </motion.div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDownload}
          className="
            flex-1
            bg-dodo-600 text-white
            px-4 py-2 rounded
            font-serif font-bold text-sm
            hover:bg-dodo-700
            transition-colors
          "
        >
          📥 Скачать
        </motion.button>

        {status === 'rejected' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReupload}
            className="
              flex-1
              bg-status-reject text-white
              px-4 py-2 rounded
              font-serif font-bold text-sm
              hover:bg-opacity-90
              transition-colors
            "
          >
            🔄 Пере載
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
