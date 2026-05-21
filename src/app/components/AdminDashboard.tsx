import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WANTEDSection } from './WANTEDSection';
import { DocumentsTable } from './DocumentsTable';
import { CreateWarrantModal } from './CreateWarrantModal';
import { VerificationScreen } from './VerificationScreen';

interface AdminDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'completed';
  uploadedAt?: string;
  reviewedAt?: string;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
}

interface WantedEmployee {
  id: string;
  name: string;
  position: string;
  reason: string;
  documentTypes: string[];
  severity: 'critical' | 'high' | 'normal';
  daysSinceIssue: number;
}

interface AdminDashboardProps {
  pendingDocuments?: AdminDocument[];
  rejectedDocuments?: AdminDocument[];
  wantedEmployees?: WantedEmployee[];
  onApproveDocument?: (docId: string, notes?: string) => Promise<void>;
  onRejectDocument?: (docId: string, reason: string) => Promise<void>;
  onCreateWarrant?: (data: any) => Promise<void>;
  employees?: Array<{ id: string; name: string }>;
}

type TabType = 'pending' | 'rejected' | 'wanted';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  pendingDocuments = [],
  rejectedDocuments = [],
  wantedEmployees = [],
  onApproveDocument,
  onRejectDocument,
  onCreateWarrant,
  employees = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [showWarrantModal, setShowWarrantModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AdminDocument | null>(null);

  const tabs = [
    { id: 'pending', label: '⏳ На проверке', count: pendingDocuments.length },
    { id: 'rejected', label: '❌ Отклоненные', count: rejectedDocuments.length },
    { id: 'wanted', label: '🚨 WANTED', count: wantedEmployees.length },
  ] as const;

  return (
    <div
      className="min-h-screen p-4 md:p-8 theme-surface-page"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl md:text-6xl font-serif font-black mb-2 tracking-wider" style={{ color: 'var(--text-primary)' }}>
          📖 АМБАРНАЯ КНИГА
        </h1>
        <p className="text-lg font-serif italic" style={{ color: 'var(--text-secondary)' }}>
          Реестр документов и сотрудников в блоке
        </p>
      </motion.div>

      {/* Кнопка создания ордера */}
      <div className="mb-8 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowWarrantModal(true)}
          className="px-6 py-3 rounded-lg font-serif font-bold shadow-lg hover:shadow-xl transition-all"
          style={{ background: 'var(--accent-primary)', color: '#fff', border: '1px solid var(--accent-secondary)' }}
        >
          📬 Создать Ордер
        </motion.button>
      </div>

      {/* Табы */}
      <div className="flex gap-2 mb-8 p-3 rounded-lg border-l-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent-primary)' }}>
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
                  ? 'text-white shadow-lg'
                  : 'border-2'
              }
            `}
            style={
              activeTab === tab.id
                ? { background: 'var(--accent-primary)' }
                : {
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-muted)',
                  }
            }
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-black" style={{ background: 'var(--status-rejected)', color: '#fff' }}>
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
              onIssueWarrant={() => setShowWarrantModal(true)}
            />
          </motion.div>
        )}

        {activeTab === 'rejected' && (
          <motion.div
            key="rejected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DocumentsTable
              documents={rejectedDocuments}
              onSelectDocument={setSelectedDocument}
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
          employees={employees}
        />
      )}

      {/* Экран верификации */}
      {selectedDocument && (
        <VerificationScreen
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onApprove={async (notes) => {
            await onApproveDocument?.(selectedDocument.id, notes);
            setSelectedDocument(null);
          }}
          onReject={async (reason) => {
            await onRejectDocument?.(selectedDocument.id, reason);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
};
