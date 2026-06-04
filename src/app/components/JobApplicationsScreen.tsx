import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../api/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, Briefcase, Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface JobApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  experience?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  notes?: string;
}

export const JobApplicationsScreen: React.FC = () => {
  const { token, user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [approvalPassword, setApprovalPassword] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadApplications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch<JobApplication[]>('/job-applications', undefined, token);
      setApplications(data);
    } catch (error) {
      console.error(error);
      toast.error('Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [token]);

  const filteredApplications = useMemo(() => {
    const byStatus = filter === 'all' ? applications : applications.filter((app) => app.status === filter);
    const query = search.trim().toLowerCase();
    if (!query) return byStatus;
    return byStatus.filter((app) => {
      const fullName = `${app.firstName} ${app.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.phone.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query)
      );
    });
  }, [applications, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const pagedApplications = useMemo(() => {
    const currentPage = Math.min(page, totalPages);
    const from = (currentPage - 1) * PAGE_SIZE;
    return filteredApplications.slice(from, from + PAGE_SIZE);
  }, [filteredApplications, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const closeModal = () => {
    setSelectedApp(null);
    setReviewNotes('');
    setApprovalPassword('');
  };

  const handleApprove = async (appId: string) => {
    if (!token) return;
    if (!approvalPassword.trim()) {
      toast.error('Укажите пароль для нового аккаунта');
      return;
    }
    try {
      await apiFetch(
        `/job-applications/${appId}/review`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'approved',
            notes: reviewNotes,
            password: approvalPassword.trim(),
          }),
        },
        token,
      );
      await loadApplications();
      setSelectedApp(null);
      setReviewNotes('');
      setApprovalPassword('');
      toast.success('Заявка одобрена. Аккаунт создан, логин = email из заявки');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось одобрить заявку');
    }
  };

  const handleReject = async (appId: string) => {
    if (!token) return;
    try {
      await apiFetch(
        `/job-applications/${appId}/review`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'rejected', notes: reviewNotes }),
        },
        token,
      );
      await loadApplications();
      setSelectedApp(null);
      setReviewNotes('');
      setApprovalPassword('');
      toast.success('Заявка отклонена');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось отклонить заявку');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'var(--status-pending)';
      case 'approved':
        return 'var(--status-confirmed)';
      case 'rejected':
        return 'var(--status-reject)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ На рассмотрении';
      case 'approved':
        return '✅ Одобрено';
      case 'rejected':
        return '❌ Отклонено';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Загрузка...</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 theme-surface-page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl md:text-6xl font-serif font-black mb-2" style={{ color: 'var(--text-primary)' }}>
          📋 ЗАЯВКИ НА РАБОТУ
        </h1>
        <p className="text-lg font-serif italic" style={{ color: 'var(--text-secondary)' }}>
          Управление заявками от претендентов
        </p>
      </motion.div>

      {/* Фильтры */}
      <div className="flex gap-2 mb-8 p-3 rounded-lg border-l-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent-primary)' }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => {
          const count = filterOption === 'all' 
            ? applications.length 
            : applications.filter((app) => app.status === filterOption).length;
          
          return (
            <motion.button
              key={filterOption}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(filterOption)}
              className={`
                relative px-6 py-3 rounded-lg
                font-serif font-bold
                transition-all duration-300
                ${
                  filter === filterOption
                    ? 'text-white shadow-lg'
                    : 'border-2'
                }
              `}
              style={
                filter === filterOption
                  ? { background: 'var(--accent-primary)' }
                  : {
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-muted)',
                    }
              }
            >
              {filterOption === 'all' && '📋 Все'}
              {filterOption === 'pending' && '⏳ На рассмотрении'}
              {filterOption === 'approved' && '✅ Одобрено'}
              {filterOption === 'rejected' && '❌ Отклонено'}
              {count > 0 && <span className="ml-2 inline-block text-xs font-black">({count})</span>}
            </motion.button>
          );
        })}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md p-3 rounded-lg border-2"
          style={{
            borderColor: 'var(--glass-border)',
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
          }}
          placeholder="Поиск по ФИО, должности, email, телефону"
        />
        <div className="text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
          Найдено: {filteredApplications.length}
        </div>
      </div>

      {/* Таблица заявок */}
      <div className="overflow-x-auto rounded-lg shadow-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)' }}>
        <table className="w-full">
          <thead>
            <tr className="bg-wood-800 text-white font-serif font-bold">
              <th className="p-4 text-left">ФИО</th>
              <th className="p-4 text-left">Контакты</th>
              <th className="p-4 text-left">Должность</th>
              <th className="p-4 text-left">Статус</th>
              <th className="p-4 text-left">Дата</th>
              <th className="p-4 text-center">Действие</th>
            </tr>
          </thead>
          <tbody>
            {pagedApplications.map((app, index) => (
              <motion.tr
                key={app.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="border-b transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border-muted)' }}
                onClick={() => setSelectedApp(app)}
              >
                <td className="p-4 font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                  {app.firstName} {app.lastName}
                </td>
                <td className="p-4" style={{ color: 'var(--text-secondary)' }}>
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {app.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" />
                      {app.phone}
                    </div>
                  </div>
                </td>
                <td className="p-4" style={{ color: 'var(--text-secondary)' }}>{app.position}</td>
                <td className="p-4">
                  <span
                    className="font-serif font-bold"
                    style={{ color: getStatusColor(app.status) }}
                  >
                    {getStatusLabel(app.status)}
                  </span>
                </td>
                <td className="p-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>{formatDate(app.createdAt)}</td>
                <td className="p-4 text-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="font-serif font-bold text-lg"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    →
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {pagedApplications.length === 0 && (
          <div className="p-8 text-center font-serif" style={{ color: 'var(--text-secondary)' }}>
            <p className="text-4xl mb-2">✅</p>
            <p>Нет заявок в этой категории</p>
          </div>
        )}
        {filteredApplications.length > 0 && (
          <div className="p-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-muted)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Страница {Math.min(page, totalPages)} из {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-lg"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-lg"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно для просмотра заявки */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl p-8 max-w-2xl w-full"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3
                    className="text-2xl font-bold font-serif"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {selectedApp.firstName} {selectedApp.lastName}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
                    Заявка на должность: <strong>{selectedApp.position}</strong>
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-2xl"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ×
                </button>
              </div>

              {/* Информация о заявке */}
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--glass-bg)' }}>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                        Email
                      </p>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {selectedApp.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--glass-bg)' }}>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                        Телефон
                      </p>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {selectedApp.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--glass-bg)' }}>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                        Должность
                      </p>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {selectedApp.position}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--glass-bg)' }}>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                        Дата подачи
                      </p>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(selectedApp.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedApp.experience && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--glass-bg)' }}>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-2">
                      Опыт работы
                    </p>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedApp.experience}
                    </p>
                  </div>
                )}

                {selectedApp.status !== 'pending' && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--glass-bg)' }}>
                    <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                      Статус: <span style={{ color: getStatusColor(selectedApp.status) }}>
                        {getStatusLabel(selectedApp.status)}
                      </span>
                    </p>
                    {selectedApp.notes && (
                      <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Примечание: {selectedApp.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Форма для рассмотрения (только если статус pending) */}
              {selectedApp.status === 'pending' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Пароль для нового аккаунта (логин будет равен email)
                    </label>
                    <input
                      type="text"
                      value={approvalPassword}
                      onChange={(e) => setApprovalPassword(e.target.value)}
                      className="w-full p-3 rounded-lg border-2"
                      style={{
                        borderColor: 'var(--glass-border)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="Введите пароль"
                    />
                  </div>

                  <textarea
                    placeholder="Примечание (опционально)"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full p-3 rounded-lg border-2 mb-4 resize-none"
                    style={{
                      borderColor: 'var(--glass-border)',
                      backgroundColor: 'var(--glass-bg)',
                      color: 'var(--text-primary)',
                    }}
                    rows={3}
                  />

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(selectedApp.id)}
                      className="flex-1 py-3 rounded-lg font-bold text-white"
                      style={{ backgroundColor: 'var(--status-confirmed)' }}
                    >
                      ✅ Одобрить
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReject(selectedApp.id)}
                      className="flex-1 py-3 rounded-lg font-bold text-white"
                      style={{ backgroundColor: 'var(--status-reject)' }}
                    >
                      ❌ Отклонить
                    </motion.button>
                  </div>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeModal}
                className="w-full mt-4 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                }}
              >
                Закрыть
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
