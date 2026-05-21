/**
 * TEMPLATE - ImprovedScheduleScreen.tsx
 * 
 * Updated schedule screen that includes:
 * - Different titles for employees ("Мои смены") vs managers ("Смены")
 * - Employee ability to decline optional shifts
 * - Employee ability to request shifts for manager approval
 * - Manager shift templates for 2/2, 5/2 patterns
 * - Manager minimum hours tracking with red highlighting
 * - Role selection dropdown
 * 
 * This is a template showing the structure - needs integration with your existing code
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  User, 
  RefreshCw, 
  Plus,
  Calendar as CalendarIcon,
  Check,
  X,
  AlertCircle,
  Send,
  Users,
  Template,
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { apiFetch } from '@/app/api/api';

interface Shift {
  id: string;
  employeeId: string;
  departmentId: string;
  startTime: string;
  endTime: string;
  role: string;
  status: 'Draft' | 'Pending' | 'Confirmed' | 'Conflict' | 'Rejected';
  type: 'Optional' | 'Mandatory' | 'Requested';
  canDecline: boolean;
  comment?: string;
}

interface ManagerStats {
  minimumHoursPerWeek: number;
  currentWeekHours: number;
  weekWarning: boolean;
  minimumHoursPerMonth: number;
  currentMonthHours: number;
  monthWarning: boolean;
}

interface ShiftTemplate {
  id: string;
  name: string;
  workDays: number;
  restDays: number;
  workHoursPerDay: number;
}

export function ImprovedScheduleScreen() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const isManager = user?.role === 'Manager';
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [managerStats, setManagerStats] = useState<ManagerStats | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    role: '',
    comment: '',
    date: '',
  });

  // Fetch shifts
  const fetchShifts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch<Shift[]>('/shifts', undefined, token);
      setShifts(data || []);
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
      toast.error('Не удалось загрузить смены');
    } finally {
      setLoading(false);
    }
  };

  // Fetch manager hours stats
  const fetchManagerStats = async () => {
    if (!token || !isManager) return;
    try {
      const data = await apiFetch<ManagerStats>('/shifts/manager/hours-stats', undefined, token);
      setManagerStats(data);
    } catch (err) {
      console.error('Failed to fetch manager stats:', err);
    }
  };

  // Fetch available roles
  const fetchAvailableRoles = async () => {
    if (!token) return;
    try {
      const data = await apiFetch<string[]>('/shifts/available-roles', undefined, token);
      setAvailableRoles(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, role: data[0] }));
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    if (!token || !isManager) return;
    try {
      const data = await apiFetch<ShiftTemplate[]>('/shift-templates/predefined', undefined, token);
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchAvailableRoles();
    if (isManager) {
      fetchManagerStats();
      fetchTemplates();
    }
  }, [token, isManager]);

  // Create shift
  const handleCreateShift = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.role) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      const startTime = new Date(`${formData.date}T${formData.startTime}`).toISOString();
      const endTime = new Date(`${formData.date}T${formData.endTime}`).toISOString();

      await apiFetch('/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user?.employee?.id,
          startTime,
          endTime,
          role: formData.role,
          comment: formData.comment,
        }),
      }, token);

      toast.success(isManager ? 'Смена создана' : 'Запрос на смену отправлен');
      setShowCreateModal(false);
      fetchShifts();
      setFormData({ startTime: '', endTime: '', role: '', comment: '', date: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка при создании смены');
    }
  };

  // Decline shift
  const handleDeclineShift = async (shiftId: string) => {
    if (!token) return;

    try {
      await apiFetch(`/shifts/${shiftId}/decline`, {
        method: 'PATCH',
      }, token);

      toast.success('Смена отклонена');
      fetchShifts();
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка при отклонении смены');
    }
  };

  // Approve/Reject shift (manager only)
  const handleUpdateShiftStatus = async (shiftId: string, status: string) => {
    if (!token) return;

    try {
      await apiFetch(`/shifts/${shiftId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }, token);

      toast.success(`Смена ${status === 'Confirmed' ? 'утверждена' : 'отклонена'}`);
      fetchShifts();
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка при обновлении смены');
    }
  };

  // Apply template to month
  const handleApplyTemplate = async () => {
    if (!token || !selectedTemplate) {
      toast.error('Выберите шаблон');
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    try {
      await apiFetch(`/shift-templates/${selectedTemplate}/apply-month?year=${year}&month=${month}&departmentId=${user?.employee?.departmentId}`, {
        method: 'POST',
      }, token);

      toast.success('Шаблон применен. Смены добавлены на месяц');
      setShowTemplateModal(false);
      fetchShifts();
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка при申用 шаблона');
    }
  };

  // Map shift status to display text
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'Draft': 'Черновик',
      'Pending': 'На рассмотрении',
      'Confirmed': 'Подтверждено',
      'Conflict': 'Конфликт',
      'Rejected': 'Отклонено',
    };
    return statusMap[status] || status;
  };

  // Format time
  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('ru-RU', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            {isManager ? 'Смены' : 'Мои смены'}
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isManager ? 'Создать смену' : 'Запросить смену'}
          >
            <Plus className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </button>

          {isManager && (
            <button
              onClick={() => setShowTemplateModal(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Использовать шаблон"
            >
              <Template className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            </button>
          )}

          <button
            onClick={() => {
              fetchShifts();
              if (isManager) fetchManagerStats();
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </motion.div>

      {/* Manager Hours Stats */}
      {isManager && managerStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass rounded-2xl p-4"
        >
          <h3 className="font-semibold mb-3">Ваша нагрузка</h3>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-3 rounded-lg"
              style={{
                backgroundColor: managerStats.weekWarning
                  ? 'rgba(244, 67, 54, 0.1)'
                  : 'rgba(76, 175, 80, 0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Неделя</span>
                {managerStats.weekWarning && <AlertTriangle className="w-4 h-4" style={{ color: '#f44336' }} />}
              </div>
              <div
                style={{
                  color: managerStats.weekWarning ? '#f44336' : 'var(--accent-primary)',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                {managerStats.currentWeekHours.toFixed(1)} / {managerStats.minimumHoursPerWeek}ч
              </div>
            </div>

            <div
              className="p-3 rounded-lg"
              style={{
                backgroundColor: managerStats.monthWarning
                  ? 'rgba(244, 67, 54, 0.1)'
                  : 'rgba(76, 175, 80, 0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Месяц</span>
                {managerStats.monthWarning && <AlertTriangle className="w-4 h-4" style={{ color: '#f44336' }} />}
              </div>
              <div
                style={{
                  color: managerStats.monthWarning ? '#f44336' : 'var(--accent-primary)',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                {managerStats.currentMonthHours.toFixed(1)} / {managerStats.minimumHoursPerMonth}ч
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Shifts List */}
      <AnimatePresence>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              Загрузка смен...
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              <Calendar Icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Нет смен</p>
            </div>
          ) : (
            shifts.map((shift, idx) => (
              <motion.div
                key={shift.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-2xl p-4 hover:scale-102 transition-transform"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {shift.role}
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            shift.type === 'Mandatory' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                          color: shift.type === 'Mandatory' ? '#f44336' : '#4caf50',
                        }}
                      >
                        {shift.type === 'Mandatory' ? 'Обязательная' : 'Опциональная'}
                      </span>
                    </h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {formatDate(shift.startTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                    </div>
                  </div>

                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor:
                        shift.status === 'Confirmed'
                          ? 'rgba(76, 175, 80, 0.2)'
                          : shift.status === 'Pending'
                            ? 'rgba(255, 193, 7, 0.2)'
                            : 'rgba(244, 67, 54, 0.2)',
                      color:
                        shift.status === 'Confirmed'
                          ? '#4caf50'
                          : shift.status === 'Pending'
                            ? '#ffc107'
                            : '#f44336',
                    }}
                  >
                    {getStatusLabel(shift.status)}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  {!isManager && shift.type === 'Optional' && shift.status === 'Confirmed' && (
                    <button
                      onClick={() => handleDeclineShift(shift.id)}
                      className="flex-1 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-1"
                      style={{ color: '#f44336' }}
                    >
                      <X className="w-4 h-4" />
                      Отклонить
                    </button>
                  )}

                  {isManager && shift.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateShiftStatus(shift.id, 'Confirmed')}
                        className="flex-1 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-1"
                        style={{ color: '#4caf50' }}
                      >
                        <Check className="w-4 h-4" />
                        Утвердить
                      </button>
                      <button
                        onClick={() => handleUpdateShiftStatus(shift.id, 'Rejected')}
                        className="flex-1 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-1"
                        style={{ color: '#f44336' }}
                      >
                        <X className="w-4 h-4" />
                        Отказать
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </AnimatePresence>

      {/* Create Shift Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isManager ? 'Создать смену' : 'Запросить смену'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div>
              <label className="text-sm font-medium">Дата</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg glass"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Время начала</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg glass"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Время окончания</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg glass"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Роль</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg glass"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Комментарий</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg glass h-20"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateShift} style={{ backgroundColor: 'var(--accent-primary)' }}>
                {isManager ? 'Создать' : 'Отправить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Modal */}
      {isManager && (
        <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Выберите шаблон для заполнения месяца</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 p-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedTemplate === template.id ? 'glass' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: selectedTemplate === template.id ? 'rgba(193, 18, 31, 0.2)' : 'transparent',
                  }}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm opacity-70">
                    {template.workDays}д работы, {template.restDays}д отдыха ({template.workHoursPerDay}ч/сутки)
                  </div>
                </button>
              ))}

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                  Отмена
                </Button>
                <Button onClick={handleApplyTemplate} style={{ backgroundColor: 'var(--accent-primary)' }}>
                  Применить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
