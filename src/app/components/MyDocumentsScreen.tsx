import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../api/api';
import { toast } from 'sonner';
import { playSound } from '../audio/sounds';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

type RequiredDocument = {
  templateId: string;
  name: string;
  description?: string | null;
  isRequired: boolean;
  submission?: {
    id: string;
    fileName?: string | null;
    fileUrl?: string | null;
    status: string;
    uploadedAt: string;
    notes?: string | null;
  } | null;
};

type UploadedDocument = {
  id: string;
  status: string;
  uploadedAt: string;
  notes?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  template?: {
    id: string;
    name?: string | null;
    description?: string | null;
    isRequired?: boolean;
  } | null;
};

type DisplayDocument = {
  id: string;
  templateId: string;
  responseId?: string;
  name: string;
  description?: string | null;
  status: string;
  statusText: string;
  fileUrl?: string | null;
  fileName?: string | null;
  notes?: string | null;
  isAssignedByAdmin?: boolean;
  isLocked: boolean;
};

type FieldConfig = {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
};

const EMPLOYEE_DATA_MARKER = 'Данные сотрудника:';
const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;

const getStatusText = (status: string, isAssignedByAdmin?: boolean) => {
  const map: Record<string, string> = {
    pending: isAssignedByAdmin ? 'Ожидает заполнения' : 'На проверке',
    submitted: 'Отправлено сотрудником',
    approved: 'Подтверждено',
    rejected: 'Отклонено',
    completed: 'Завершено',
  };
  return map[status] || status;
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    pending: 'var(--status-pending)',
    submitted: 'var(--accent-primary)',
    approved: 'var(--status-confirmed)',
    rejected: 'var(--status-rejected)',
    completed: 'var(--status-confirmed)',
  };
  return map[status] || 'var(--text-secondary)';
};

const getFieldConfig = (name: string): FieldConfig[] => {
  const normalized = name.toLowerCase();
  if (normalized.includes('паспорт')) {
    return [
      { key: 'fullName', label: 'ФИО', placeholder: 'Иванов Иван Иванович', required: true },
      { key: 'series', label: 'Серия', placeholder: '1234', required: true },
      { key: 'number', label: 'Номер', placeholder: '567890', required: true },
      { key: 'issuedBy', label: 'Кем выдан', placeholder: 'УМВД России...', required: true },
      { key: 'issueDate', label: 'Дата выдачи', placeholder: '01.01.2024', required: true },
      { key: 'divisionCode', label: 'Код подразделения', placeholder: '000-000' },
      { key: 'registrationAddress', label: 'Адрес регистрации', placeholder: 'г. Москва, ...', required: true },
    ];
  }
  if (normalized.includes('снилс')) {
    return [
      { key: 'snilsNumber', label: 'Номер СНИЛС', placeholder: '000-000-000 00', required: true },
      { key: 'fullName', label: 'ФИО', placeholder: 'Иванов Иван Иванович', required: true },
    ];
  }
  if (normalized.includes('инн')) {
    return [
      { key: 'innNumber', label: 'Номер ИНН', placeholder: '123456789012', required: true },
      { key: 'fullName', label: 'ФИО', placeholder: 'Иванов Иван Иванович', required: true },
    ];
  }
  if (normalized.includes('медицин')) {
    return [
      { key: 'bookNumber', label: 'Номер книжки', placeholder: 'МК-001234', required: true },
      { key: 'issueDate', label: 'Дата выдачи', placeholder: '01.01.2024', required: true },
      { key: 'expiryDate', label: 'Действует до', placeholder: '01.01.2025', required: true },
      { key: 'issuedBy', label: 'Кем выдана', placeholder: 'Медицинский центр', required: true },
    ];
  }
  return [
    { key: 'documentNumber', label: 'Номер документа', placeholder: 'Введите номер', required: true },
    { key: 'issueDate', label: 'Дата документа', placeholder: '01.01.2024', required: true },
    { key: 'comment', label: 'Комментарий', placeholder: 'Дополнительные сведения' },
  ];
};

const extractEmployeeSection = (notes?: string | null) => {
  if (!notes) return '';
  const markerIndex = notes.indexOf(EMPLOYEE_DATA_MARKER);
  if (markerIndex === -1) return notes.trim();
  return notes.slice(markerIndex + EMPLOYEE_DATA_MARKER.length).trim();
};

const extractAdminSection = (notes?: string | null) => {
  if (!notes) return '';
  const markerIndex = notes.indexOf(EMPLOYEE_DATA_MARKER);
  if (markerIndex === -1) return '';
  return notes.slice(0, markerIndex).trim();
};

const extractLastAdminRejectReason = (notes?: string | null) => {
  if (!notes) return '';
  const rows = notes
    .split('\n')
    .filter((line) => line.includes('ADMIN_REVIEW [REJECTED]'));
  if (rows.length === 0) return '';
  return rows[rows.length - 1].split('ADMIN_REVIEW [REJECTED]:')[1]?.trim() || '';
};

const parseFormData = (notes: string | null | undefined, fields: FieldConfig[]) => {
  const block = extractEmployeeSection(notes);
  const map = Object.fromEntries(fields.map((field) => [field.key, '']));
  block.split('\n').forEach((line) => {
    const [label, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    const field = fields.find((item) => item.label === label.trim());
    if (field) map[field.key] = value;
  });
  return map;
};

const formatFormData = (fields: FieldConfig[], values: Record<string, string>) =>
  `${EMPLOYEE_DATA_MARKER}\n${fields
    .map((field) => `${field.label}: ${(values[field.key] || '').trim()}`)
    .filter((line) => !line.endsWith(':'))
    .join('\n')}`;

export default function MyDocumentsScreen() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<DisplayDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DisplayDocument | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [fileNameInput, setFileNameInput] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { formValues: Record<string, string>; fileUrlInput: string; fileNameInput: string }>>({});
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  useEffect(() => {
    if (!isPreviewFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPreviewFullscreen]);

  const [submitting, setSubmitting] = useState(false);

  const loadDocuments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [requiredDocs, uploadedDocs] = await Promise.all([
        apiFetch<RequiredDocument[]>('/employee-documents/required', undefined, token),
        apiFetch<UploadedDocument[]>('/employee-documents/my-uploads', undefined, token),
      ]);

      const requiredMapped: DisplayDocument[] = requiredDocs.map((doc) => ({
        id: doc.templateId,
        templateId: doc.templateId,
        responseId: doc.submission?.id,
        name: doc.name,
        description: doc.description || 'Без описания',
        status: doc.submission?.status || 'pending',
        statusText: doc.submission ? getStatusText(doc.submission.status) : 'Нужно заполнить',
        fileUrl: doc.submission?.fileUrl,
        fileName: doc.submission?.fileName,
        notes: doc.submission?.notes,
        isLocked: ['submitted', 'approved', 'completed'].includes(doc.submission?.status || ''),
      }));

      const assignedDocs: DisplayDocument[] = uploadedDocs
        .filter((doc) => !doc.template?.isRequired)
        .map((doc) => ({
          id: doc.id,
          templateId: doc.template?.id || doc.id,
          responseId: doc.id,
          name: doc.template?.name || 'Документ',
          description: doc.template?.description || 'Документ назначен администратором',
          status: doc.status,
          statusText: getStatusText(doc.status, true),
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          notes: doc.notes,
          isAssignedByAdmin: true,
          isLocked: ['submitted', 'approved', 'completed'].includes(doc.status),
        }));

      setDocuments([...requiredMapped, ...assignedDocs]);
    } catch (error) {
      console.error(error);
      toast.error('Не удалось загрузить документы');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [token]);

  const selectedFields = useMemo(
    () => (selectedDocument ? getFieldConfig(selectedDocument.name) : []),
    [selectedDocument],
  );

  const stats = useMemo(
    () => ({
      total: documents.length,
      uploaded: documents.filter((doc) => doc.isLocked).length,
      pending: documents.filter((doc) => !doc.isLocked).length,
    }),
    [documents],
  );

  const pendingDocuments = useMemo(
    () => documents.filter((doc) => !doc.isLocked),
    [documents],
  );

  const completedDocuments = useMemo(
    () => documents.filter((doc) => doc.isLocked),
    [documents],
  );

  const openDocument = (doc: DisplayDocument) => {
    const draft = drafts[doc.id];
    setSelectedDocument(doc);
    setFormValues(draft?.formValues || parseFormData(doc.notes, getFieldConfig(doc.name)));
    setFileUrlInput(draft?.fileUrlInput ?? (doc.fileUrl || ''));
    setFileNameInput(draft?.fileNameInput ?? (doc.fileName || ''));
  };

  const saveDraft = (docId: string, next: Partial<{ formValues: Record<string, string>; fileUrlInput: string; fileNameInput: string }>) => {
    setDrafts((prev) => ({
      ...prev,
      [docId]: {
        formValues: next.formValues ?? prev[docId]?.formValues ?? formValues,
        fileUrlInput: next.fileUrlInput ?? prev[docId]?.fileUrlInput ?? fileUrlInput,
        fileNameInput: next.fileNameInput ?? prev[docId]?.fileNameInput ?? fileNameInput,
      },
    }));
  };

  const handlePickFile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error('Файл слишком большой. Максимум 8 МБ');
      return;
    }

    const toBase64 = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    const dataUrl = await toBase64();
    setFileUrlInput(dataUrl);
    setFileNameInput(file.name);
    if (selectedDocument) {
      saveDraft(selectedDocument.id, { fileUrlInput: dataUrl, fileNameInput: file.name });
    }
  };

  const handleSubmit = async () => {
    if (!token || !selectedDocument) return;
    if (!window.confirm('Подтвердить отправку документа?')) return;
    playSound('respect');
    const fields = getFieldConfig(selectedDocument.name);
    const missingField = fields.find((field) => field.required && !(formValues[field.key] || '').trim());
    if (missingField) {
      toast.error(`Заполните поле "${missingField.label}"`);
      return;
    }

    const notes = formatFormData(fields, formValues);
    setSubmitting(true);
    try {
      if (selectedDocument.isAssignedByAdmin && selectedDocument.responseId) {
        await apiFetch(
          `/employee-documents/document/${selectedDocument.responseId}/respond`,
          {
            method: 'PUT',
            body: JSON.stringify({
              fileName: fileNameInput.trim() || selectedDocument.name,
              fileUrl: fileUrlInput.trim() || undefined,
              notes,
              status: 'submitted',
            }),
          },
          token,
        );
      } else {
        await apiFetch(
          `/employee-documents/upload/${selectedDocument.templateId}`,
          {
            method: 'POST',
            body: JSON.stringify({
              fileName: fileNameInput.trim() || selectedDocument.name,
              fileUrl: fileUrlInput.trim() || undefined,
              notes,
            }),
          },
          token,
        );
      }

      toast.success('Документ отправлен');
      playSound('edited');
      if (selectedDocument) {
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[selectedDocument.id];
          return next;
        });
      }
      setSelectedDocument(null);
      await loadDocuments();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось отправить документ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Загрузка документов...</div>;
  }

  return (
    <div className="space-y-6 theme-surface-page p-1">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Мои документы</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Здесь можно заполнить паспортные и другие данные один раз, а затем только просматривать их.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 theme-surface-card" style={{ color: 'var(--text-primary)' }}>Всего документов: <strong>{stats.total}</strong></div>
        <div className="rounded-xl p-4 theme-surface-card" style={{ color: 'var(--text-primary)' }}>Заполнено: <strong>{stats.uploaded}</strong></div>
        <div className="rounded-xl p-4 theme-surface-card" style={{ color: 'var(--text-primary)' }}>Ожидают заполнения: <strong>{stats.pending}</strong></div>
      </div>

      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="rounded-xl p-6 theme-surface-card" style={{ color: 'var(--text-secondary)' }}>
            Для вашего аккаунта пока нет документов.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Нужно заполнить</h2>
              {pendingDocuments.length === 0 ? (
                <div className="rounded-xl p-4 theme-surface-card" style={{ color: 'var(--text-secondary)' }}>
                  Нет документов, ожидающих заполнения.
                </div>
              ) : (
                pendingDocuments.map((doc) => (
                  <div key={doc.id} className="rounded-xl p-5 border theme-surface-card-raised" style={{ borderColor: 'var(--border-muted)' }}>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.name}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{doc.description || 'Без описания'}</div>
                        {extractAdminSection(doc.notes) && (
                          <div className="text-sm whitespace-pre-line" style={{ color: 'var(--accent-primary)' }}>
                            {extractAdminSection(doc.notes)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-3">
                        <div className="text-sm" style={{ color: getStatusColor(doc.status) }}>
                          {doc.statusText}
                        </div>
                        <Button
                          onClick={() => openDocument(doc)}
                          style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff' }}
                        >
                          Заполнить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Заполненные документы</h2>
              {completedDocuments.map((doc) => (
                <div key={doc.id} className="rounded-xl p-5 border theme-surface-card" style={{ borderColor: 'var(--border-muted)' }}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.name}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{doc.description || 'Без описания'}</div>
                        {doc.status === 'rejected' && (
                          <div className="text-sm" style={{ color: 'var(--status-rejected)' }}>
                            Причина отклонения: {extractLastAdminRejectReason(doc.notes) || 'указана в истории'}
                          </div>
                        )}
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-3">
                      <div className="text-sm" style={{ color: getStatusColor(doc.status) }}>
                        {doc.statusText}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => openDocument(doc)}
                          style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                        >
                          Смотреть
                        </Button>
                        {doc.fileUrl && (
                          <Button asChild variant="outline">
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer">Открыть файл</a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument((prev) => prev)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}>
          <DialogHeader className="px-6 py-5 border-b" style={{ borderColor: 'var(--border-muted)', background: 'var(--bg-secondary)' }}>
            <DialogTitle className="text-xl" style={{ color: 'var(--text-primary)' }}>{selectedDocument?.name}</DialogTitle>
            <DialogDescription>
              {selectedDocument?.isLocked
                ? 'Документ уже заполнен и доступен только для просмотра.'
                : 'Заполните документ на русском языке. После отправки редактирование будет недоступно.'}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-5 p-6 max-h-[75vh] overflow-auto">
              <div className="rounded-xl p-4 border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-muted)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Статус: <span style={{ color: getStatusColor(selectedDocument.status), fontWeight: 700 }}>{selectedDocument.statusText}</span>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {selectedFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      {field.label}
                    </label>
                    {selectedDocument.isLocked ? (
                      <div className="rounded-lg border p-3 min-h-11" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
                        {formValues[field.key] || 'Не указано'}
                      </div>
                    ) : (
                      <input
                        value={formValues[field.key] || ''}
                        onChange={(e) => {
                          const next = { ...formValues, [field.key]: e.target.value };
                          setFormValues(next);
                          if (selectedDocument) saveDraft(selectedDocument.id, { formValues: next });
                        }}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border p-3"
                        style={{
                          borderColor: 'var(--glass-border)',
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-primary)',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 border space-y-3" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-muted)' }}>
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Файл документа
                </label>
                {selectedDocument.isLocked ? (
                  <div className="rounded-lg border p-3" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
                    {fileNameInput || 'Не указан'}
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      onChange={(e) => handlePickFile(e.target.files?.[0])}
                      className="w-full rounded-lg border p-3"
                      style={{
                        borderColor: 'var(--glass-border)',
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-primary)',
                      }}
                    />
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {fileNameInput || 'Файл не выбран'} (максимум 8 МБ)
                    </div>
                  </>
                )}
              </div>

              {fileUrlInput && (
                <button
                  onClick={() => setIsPreviewFullscreen(true)}
                  type="button"
                  className="w-full rounded-lg border p-3 text-left"
                  style={{ borderColor: 'var(--glass-border)', color: 'var(--accent-primary)', background: 'var(--accent-soft)' }}
                >
                  Открыть предпросмотр документа на весь экран
                </button>
              )}

              {selectedDocument.notes && selectedDocument.notes.includes('[HISTORY') && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    История проверки
                  </label>
                  <div className="rounded-lg border p-3 max-h-40 overflow-auto text-sm" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>
                    {selectedDocument.notes
                      .split('\n')
                      .filter((row) => row.includes('[HISTORY'))
                      .map((row, idx) => (
                        <div key={`${row}-${idx}`}>{row}</div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedDocument(null)}>
                  Закрыть
                </Button>
                {!selectedDocument.isLocked && (
                  <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Отправка...' : 'Отправить документ'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {isPreviewFullscreen && fileUrlInput && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsPreviewFullscreen(false);
            }
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewFullscreen(false);
            }}
            className="absolute top-4 right-4 px-3 py-1 rounded"
            style={{ background: '#fff', color: '#000' }}
          >
            Закрыть
          </button>
          <div
            className="w-full h-full flex items-center justify-center"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {fileUrlInput.startsWith('data:application/pdf') ? (
              <iframe
                src={fileUrlInput}
                className="w-full h-full rounded"
                title={fileNameInput || selectedDocument?.name || 'Документ'}
              />
            ) : (
              <img
                src={fileUrlInput}
                alt={selectedDocument?.name || 'Документ'}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
