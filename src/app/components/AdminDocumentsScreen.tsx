import React, { useEffect, useMemo, useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../api/api';
import { toast } from 'sonner';
import { playSound } from '../audio/sounds';

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

type RawDocument = {
  id: string;
  status: string;
  uploadedAt?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  notes?: string | null;
  templateId: string;
  template?: { name?: string | null } | null;
  employee?: { firstName?: string | null; lastName?: string | null } | null;
  employeeId: string;
};

type EmployeeOption = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  departmentId?: string | null;
};

type DocumentTemplateOption = {
  id: string;
  name: string;
  isRequired: boolean;
  department?: string | null;
};

type CreateWarrantPayload = {
  employeeId: string;
  documentTypeId: string;
  deadline: string;
  priority: 'high' | 'normal' | 'low';
  message: string;
};

export const AdminDocumentsScreen: React.FC = () => {
  const { token } = useAuth();
  const [pendingDocs, setPendingDocs] = useState<AdminDocument[]>([]);
  const [rejectedDocs, setRejectedDocs] = useState<AdminDocument[]>([]);
  const [allDocs, setAllDocs] = useState<RawDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplateOption[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [docs, employeeRows, templateRows] = await Promise.all([
        apiFetch<RawDocument[]>('/employee-documents/admin/all', undefined, token),
        apiFetch<EmployeeOption[]>('/employees', undefined, token),
        apiFetch<DocumentTemplateOption[]>('/employee-documents/templates', undefined, token),
      ]);
      setAllDocs(docs);
      setTemplates(templateRows);
      setPendingDocs(
        docs
          .filter((doc) => ['pending', 'submitted'].includes(doc.status))
          .map((doc) => ({
          id: doc.id,
          employeeId: doc.employeeId,
          employeeName: `${doc.employee?.firstName ?? ''} ${doc.employee?.lastName ?? ''}`.trim() || 'Сотрудник',
          documentType: doc.template?.name || 'Документ',
          status: (doc.status as AdminDocument['status']) || 'pending',
          uploadedAt: doc.uploadedAt,
          fileUrl: doc.fileUrl || undefined,
          fileName: doc.fileName || undefined,
          notes: doc.notes || undefined,
        })),
      );
      setRejectedDocs(
        docs
          .filter((doc) => doc.status === 'rejected')
          .map((doc) => ({
            id: doc.id,
            employeeId: doc.employeeId,
            employeeName: `${doc.employee?.firstName ?? ''} ${doc.employee?.lastName ?? ''}`.trim() || 'Сотрудник',
            documentType: doc.template?.name || 'Документ',
            status: 'rejected',
            uploadedAt: doc.uploadedAt,
            fileUrl: doc.fileUrl || undefined,
            fileName: doc.fileName || undefined,
            notes: doc.notes || undefined,
        })),
      );
      const mappedEmployees = employeeRows.map((employee) => ({
        id: employee.id,
        name: `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() || 'Сотрудник',
      }));
      setEmployees(
        mappedEmployees,
      );
    } catch (error) {
      console.error(error);
      toast.error('Не удалось загрузить документы');
      setPendingDocs([]);
      setRejectedDocs([]);
      setAllDocs([]);
      setTemplates([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const wantedEmps = useMemo<WantedEmployee[]>(() => {
    const requiredTemplates = templates.filter((template) => template.isRequired);
    if (requiredTemplates.length === 0) return [];

    const docsByEmployee = new Map<string, RawDocument[]>();
    for (const doc of allDocs) {
      const bucket = docsByEmployee.get(doc.employeeId) ?? [];
      bucket.push(doc);
      docsByEmployee.set(doc.employeeId, bucket);
    }

    return employees
      .map((employee) => {
        const employeeDocs = docsByEmployee.get(employee.id) ?? [];
        const missingTemplateNames = requiredTemplates
          .filter((template) => {
            const submission = employeeDocs.find((doc) => doc.templateId === template.id);
            return !submission || submission.status === 'rejected';
          })
          .map((template) => template.name);

        if (missingTemplateNames.length === 0) return null;

        return {
          id: employee.id,
          name: employee.name,
          position: 'Сотрудник',
          reason: `Не загружен обязательный пакет документов (${missingTemplateNames.length})`,
          documentTypes: missingTemplateNames,
          severity: missingTemplateNames.length >= 3 ? 'critical' : 'high',
          daysSinceIssue: 0,
        } satisfies WantedEmployee;
      })
      .filter((item): item is WantedEmployee => Boolean(item));
  }, [allDocs, employees, templates]);

  const filteredPendingDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pendingDocs;
    return pendingDocs.filter((doc) =>
      `${doc.employeeName} ${doc.documentType}`.toLowerCase().includes(q),
    );
  }, [pendingDocs, query]);

  const filteredRejectedDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rejectedDocs;
    return rejectedDocs.filter((doc) =>
      `${doc.employeeName} ${doc.documentType}`.toLowerCase().includes(q),
    );
  }, [rejectedDocs, query]);

  const filteredWanted = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wantedEmps;
    return wantedEmps.filter((employee) =>
      `${employee.name} ${employee.reason} ${employee.documentTypes.join(' ')}`.toLowerCase().includes(q),
    );
  }, [wantedEmps, query]);

  const handleApproveDocument = async (docId: string, notes?: string) => {
    if (!token) return;
    try {
      await apiFetch(
        `/employee-documents/admin/review/${docId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'approved', notes }),
        },
        token,
      );
      await loadData();
      toast.success('Документ одобрен');
      playSound('edited');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось одобрить документ');
    }
  };

  const handleRejectDocument = async (docId: string, reason: string) => {
    if (!token) return;
    try {
      await apiFetch(
        `/employee-documents/admin/review/${docId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'rejected', notes: reason }),
        },
        token,
      );
      toast.success('Документ отклонен');
      playSound('condemnation');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось отклонить документ');
    }
  };

  const handleCreateWarrant = async (data: CreateWarrantPayload) => {
    if (!token) return;
    if (!data.employeeId) {
      toast.error('Выберите сотрудника');
      throw new Error('employeeId is required');
    }

    const selectedEmployee = employees.find((employee) => employee.id === data.employeeId);

    try {
      await apiFetch(
        '/employee-documents/admin/assign',
        {
          method: 'POST',
          body: JSON.stringify({
            employeeId: data.employeeId,
            documentName: data.documentTypeId,
            deadline: data.deadline,
            priority: data.priority,
            notes: [
              `Сотрудник: ${selectedEmployee?.name || data.employeeId}`,
              data.message.trim(),
            ]
              .filter(Boolean)
              .join('\n'),
          }),
        },
        token,
      );
      toast.success('Документ создан');
      playSound('edited');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось создать документ');
      throw error instanceof Error ? error : new Error('Не удалось создать документ');
    }
  };

  if (loading) {
    return <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-md rounded-lg border px-3 py-2"
        style={{ borderColor: 'var(--border-muted)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
        placeholder="Поиск по сотруднику или документу"
      />
      <AdminDashboard
        pendingDocuments={filteredPendingDocs}
        rejectedDocuments={filteredRejectedDocs}
        wantedEmployees={filteredWanted}
        onApproveDocument={handleApproveDocument}
        onRejectDocument={handleRejectDocument}
        onCreateWarrant={handleCreateWarrant}
        employees={employees}
      />
    </div>
  );
};
