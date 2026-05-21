import React, { useState } from 'react';
import { motion } from 'motion/react';

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
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const reasonConfig = {
    MISSING: { emoji: '❌', label: 'ОТСУТСТВУЕТ' },
    EXPIRED: { emoji: '⚠️', label: 'ИСТЁК СРОК' },
    PENDING: { emoji: '⏳', label: 'НА ПРОВЕРКЕ' },
    REJECTED: { emoji: '❌', label: 'ОТКЛОНЁН' },
  };

  const config = reasonConfig[reason];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 30;
      });
    }, 300);

    try {
      await onUpload(file);
      setUploadProgress(100);
      setFile(null);
    } finally {
      clearInterval(interval);
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="
        fixed inset-0 z-50
        bg-wood-900 bg-opacity-90
        flex items-center justify-center
        p-4
      "
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -2 }}
        animate={{ scale: 1, rotate: -1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        className="
          relative
          bg-parchment-200
          border-4 border-dashed border-ink-800
          rounded-lg
          shadow-2xl
          p-8 md:p-12
          max-w-md w-full
          transform
        "
      >
        {/* Nail decoration */}
        <div className="
          absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-5 h-5 rounded-full bg-ink-900 shadow-lg
          border-2 border-ink-700
        " />

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-6xl mb-4"
          >
            {config.emoji}
          </motion.div>

          <h1 className="
            text-3xl md:text-4xl font-serif font-black
            text-ink-900 mb-2
            tracking-widest
          ">
            ДОСТУП ЗАКРЫТ
          </h1>

          <p className="
            text-lg font-serif italic
            text-sepia-700 mb-6
          ">
            Разыскивается: <span className="font-bold">{documentName}</span>
          </p>

          <div className="
            inline-block
            bg-status-reject text-white
            px-4 py-2 rounded-full
            font-serif font-bold text-sm
            mb-8
          ">
            {config.label}
          </div>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          {!isUploading && !file ? (
            <motion.div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              animate={isDragging ? { borderColor: '#ff6b35' } : {}}
              className="
                border-3 border-dashed border-ink-400
                rounded-xl p-8
                text-center
                cursor-pointer
                transition-all
                hover:border-dodo-600 hover:bg-parchment-100
              "
            >
              <label className="cursor-pointer block">
                <div className="text-5xl mb-3">📁</div>
                <p className="font-serif text-ink-800 font-bold mb-2">
                  Перетащите файл сюда
                </p>
                <p className="font-serif text-sm text-sepia-600">
                  или нажмите, чтобы выбрать
                </p>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                />
              </label>

              {/* Ember particles on drag */}
              {isDragging && (
                <>
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="
                      absolute top-10 left-10
                      w-3 h-3 rounded-full bg-dodo-600
                      shadow-lg
                    "
                    style={{
                      boxShadow: '0 0 10px rgba(255, 107, 53, 0.8)',
                    }}
                  />
                  <motion.div
                    animate={{
                      y: [0, -25, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    className="
                      absolute top-8 right-12
                      w-2 h-2 rounded-full bg-dodo-500
                      shadow-lg
                    "
                    style={{
                      boxShadow: '0 0 8px rgba(255, 107, 53, 0.8)',
                    }}
                  />
                  <motion.div
                    animate={{
                      y: [0, -15, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                    className="
                      absolute bottom-12 left-12
                      w-2 h-2 rounded-full bg-dodo-600
                      shadow-lg
                    "
                    style={{
                      boxShadow: '0 0 10px rgba(255, 107, 53, 0.8)',
                    }}
                  />
                </>
              )}
            </motion.div>
          ) : file && !isUploading ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                bg-white p-4 rounded-lg
                border-2 border-status-approve
              "
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <p className="font-serif font-bold text-ink-900">
                    {file.name}
                  </p>
                  <p className="text-sm text-sepia-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="relative h-2 bg-parchment-300 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-status-approve"
                />
              </div>
              <p className="text-center font-serif text-sm text-ink-800">
                {uploadProgress.toFixed(0)}% загружено...
              </p>
            </motion.div>
          )}
        </div>

        {/* Upload Button */}
        {file && !isUploading && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUpload}
            disabled={isLoading || isUploading}
            className="
              w-full
              bg-dodo-600 text-white
              py-4 rounded-lg
              font-serif font-black text-lg
              shadow-lg hover:shadow-xl
              transition-all
              disabled:opacity-50
            "
          >
            📤 Загрузить документ
          </motion.button>
        )}

        {/* Info */}
        <p className="
          text-xs mt-6 text-center
          font-serif text-sepia-700
        ">
          Максимум: 10 MB (PDF, JPG, PNG, WEBP)
        </p>
      </motion.div>
    </motion.div>
  );
};
