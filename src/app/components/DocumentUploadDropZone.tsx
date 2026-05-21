import React, { useState } from 'react';
import { motion } from 'motion/react';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setIsSuccess(false);

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
      await onUpload(selectedFile);
      setUploadProgress(100);
      setIsSuccess(true);
      setSelectedFile(null);

      // Reset after 2 seconds
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        bg-white rounded-lg
        shadow-lg border-3 border-dashed
        p-8 md:p-12
        transition-all
      "
      style={{
        borderColor: isDragging ? '#ff6b35' : '#e8d9c3',
        backgroundColor: isDragging ? 'rgba(255, 107, 53, 0.05)' : '#ffffff',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!isUploading && !isSuccess ? (
        <div>
          {!selectedFile ? (
            <label className="
              block text-center cursor-pointer
            ">
              <motion.div
                animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                className="text-5xl mb-4"
              >
                {isDragging ? '✨' : '📁'}
              </motion.div>

              <p className="
                text-lg font-serif font-bold
                text-ink-900 mb-2
              ">
                {isDragging ? 'Отпустите файл здесь' : 'Перетащите файл сюда'}
              </p>

              <p className="
                text-sm font-serif text-sepia-600 mb-6
              ">
                или нажмите, чтобы выбрать из компьютера
              </p>

              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
              />

              <p className="
                text-xs text-ink-600 font-serif
              ">
                Макс. размер: 10 MB (PDF, JPG, PNG, WEBP)
              </p>
            </label>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="
                bg-parchment-100 p-4 rounded-lg
                flex items-center gap-4
              ">
                <div className="text-3xl">📄</div>
                <div className="flex-1">
                  <p className="font-serif font-bold text-ink-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-sepia-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setSelectedFile(null)}
                  className="text-2xl"
                >
                  ✕
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUpload}
                className="
                  w-full
                  bg-dodo-600 text-white
                  py-3 rounded-lg
                  font-serif font-bold
                  shadow-lg hover:shadow-xl
                  transition-all
                "
              >
                📤 Загрузить
              </motion.button>
            </motion.div>
          )}

          {/* Ember particles */}
          {isDragging && (
            <>
              <motion.div
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="
                  absolute top-12 left-12
                  w-3 h-3 rounded-full bg-dodo-600
                "
                style={{
                  boxShadow: '0 0 12px rgba(255, 107, 53, 1)',
                }}
              />
              <motion.div
                animate={{
                  y: [0, -35, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                className="
                  absolute top-8 right-16
                  w-2 h-2 rounded-full bg-dodo-500
                "
                style={{
                  boxShadow: '0 0 10px rgba(255, 107, 53, 1)',
                }}
              />
              <motion.div
                animate={{
                  y: [0, -25, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                className="
                  absolute bottom-12 left-20
                  w-2 h-2 rounded-full bg-dodo-600
                "
                style={{
                  boxShadow: '0 0 12px rgba(255, 107, 53, 1)',
                }}
              />
            </>
          )}
        </div>
      ) : isUploading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="text-4xl text-center mb-4">⏳</div>
          <div className="
            relative h-3 bg-parchment-300
            rounded-full overflow-hidden
          ">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-status-approve"
            />
          </div>
          <p className="
            text-center font-serif font-bold
            text-ink-900
          ">
            {uploadProgress.toFixed(0)}% загружено...
          </p>
        </motion.div>
      ) : isSuccess ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="text-6xl mb-4"
          >
            ✅
          </motion.div>
          <p className="
            font-serif font-bold text-lg
            text-status-approve
          ">
            Документ успешно загружен!
          </p>
        </motion.div>
      ) : null}
    </motion.div>
  );
};
