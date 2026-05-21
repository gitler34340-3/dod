import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentCard } from './DocumentCard';
import { DocumentUploadDropZone } from './DocumentUploadDropZone';

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
  onDownload?: (docId: string) => void;
  onUpload?: (file: File) => Promise<void>;
  onReupload?: (docId: string) => void;
}

type FilterType = 'all' | 'active' | 'pending' | 'expired';

export const EmployeeCabinet: React.FC<EmployeeCabinetProps> = ({
  documents,
  onDownload,
  onUpload,
  onReupload,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isUploading, setIsUploading] = useState(false);

  const filteredDocuments = useMemo(() => {
    if (activeFilter === 'all') return documents;
    return documents.filter((doc) => doc.status === activeFilter);
  }, [documents, activeFilter]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await onUpload?.(file);
    } finally {
      setIsUploading(false);
    }
  };

  const filters = [
    { id: 'all', label: 'Все', count: documents.length },
    {
      id: 'active',
      label: 'Активные',
      count: documents.filter((d) => d.status === 'active').length,
    },
    {
      id: 'pending',
      label: 'На проверке',
      count: documents.filter((d) => d.status === 'pending').length,
    },
    {
      id: 'expired',
      label: 'Истёкшие',
      count: documents.filter((d) => d.status === 'expired').length,
    },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="
        min-h-screen
        bg-parchment-200
        p-4 md:p-8
      "
    >
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
        ">
          📋 Мои Документы
        </h1>
        <p className="
          text-lg text-sepia-600
          font-serif italic
        ">
          Управление вашими рабочими документами
        </p>
      </motion.div>

      {/* Фильтры */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="
          flex flex-wrap gap-2 mb-8
          bg-parchment-100 p-3 rounded-lg
          border-l-4 border-wood-800
        "
      >
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(filter.id as FilterType)}
            className={`
              relative px-6 py-2 rounded-lg
              font-serif font-bold
              transition-all duration-300
              ${
                activeFilter === filter.id
                  ? 'bg-dodo-600 text-white shadow-lg'
                  : 'bg-white text-ink-800 border-2 border-ink-300 hover:border-dodo-600'
              }
            `}
          >
            {filter.label}
            {filter.count > 0 && (
              <span className="
                ml-2 inline-block
                text-xs font-black
              ">
                ({filter.count})
              </span>
            )}
            {activeFilter === filter.id && (
              <motion.div
                layoutId="activeFilter"
                className="
                  absolute bottom-0 left-0 right-0
                  h-1 bg-white
                "
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Документы сетка */}
      <AnimatePresence mode="wait">
        {filteredDocuments.length > 0 ? (
          <motion.div
            key="documents"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
              gap-6 mb-8
            "
          >
            {filteredDocuments.map((doc, idx) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <DocumentCard
                  id={doc.id}
                  title={doc.title}
                  status={doc.status}
                  issuedDate={doc.issuedDate}
                  expiryDate={doc.expiryDate}
                  onDownload={() => onDownload?.(doc.id)}
                  onReupload={() => onReupload?.(doc.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              text-center py-12
              bg-white rounded-lg
              border-2 border-dashed border-ink-300
            "
          >
            <p className="text-4xl mb-4">📭</p>
            <p className="font-serif text-ink-700">
              Нет документов в этой категории
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Загрузка новых документов */}
      <div className="mb-8">
        <h2 className="
          text-2xl font-serif font-bold
          text-ink-900 mb-4
        ">
          📤 Загрузить новый документ
        </h2>
        <DocumentUploadDropZone
          onUpload={handleUpload}
          isLoading={isUploading}
        />
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="
          bg-wood-800 text-white
          p-6 rounded-lg
          font-serif text-sm
        "
      >
        <p className="font-bold mb-2">💡 Совет:</p>
        <ul className="space-y-1 text-xs opacity-90">
          <li>✓ Загружайте четкие копии всех документов</li>
          <li>✓ Убедитесь, что все данные видны на сканах</li>
          <li>✓ Контролируйте даты истечения документов</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};
