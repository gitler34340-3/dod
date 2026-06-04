import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  RefreshCw, 
  Plus,
  Calendar as CalendarIcon,
  Check,
  X,
  AlertCircle,
  Send,
  Users,
  Trash2,
  Edit2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../audio/sounds';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const cleanPayload = (obj: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
};

interface Shift {
  id: string;
  userId?: string;
  employeeId?: string;
  employeeName?: string;
  exchangeTargetEmployeeId?: string;
  exchangeTargetEmployeeName?: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  fullStartTime?: string;
  fullEndTime?: string;
  location?: string;
  position: string;
  status: 'confirmed' | 'pending' | 'conflict' | 'draft' | 'rejected';
  type?: 'Mandatory' | 'Optional' | 'Requested';
  createdBy?: string;
  comment?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  exchangeDeclined?: boolean;
}

export function ImprovedScheduleScreen() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  
  // Используем useRef вместо useState для обхода проблемы с замыканиями (stale closure) внутри setInterval
  const shownExchangeAcceptedRef = useRef<string[]>([]);
  const exchangeSeenStorageKey = user?.employeeId ? `seen_exchange_accepted_${user.employeeId}` : null;
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [exchangeTargetEmployeeId, setExchangeTargetEmployeeId] = useState('');

  const [showPastShifts, setShowPastShifts] = useState(false);

  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newComment, setNewComment] = useState('');

  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignDate, setAssignDate] = useState('');
  const [assignStart, setAssignStart] = useState('');
  const [assignEnd, setAssignEnd] = useState('');
  const [assignRole, setAssignRole] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);

  const [openDate, setOpenDate] = useState('');
  const [openStart, setOpenStart] = useState('');
  const [openEnd, setOpenEnd] = useState('');
  const [openRole, setOpenRole] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(1);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editComment, setEditComment] = useState('');
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const EXCHANGE_DECLINED_MARKER = '[exchange_declined]';
  const confirmForEmployee = (message: string) => {
    if (user?.role !== 'Employee') return true;
    const confirmed = window.confirm(message);
    if (confirmed) playSound('respect');
    return confirmed;
  };

  const translateRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      'Cashier': 'Кассир',
      'Supervisor': 'Супервайзер',
      'Cleaner': 'Уборщик',
      'Chef': 'Повар',
      'Waiter': 'Официант',
      'Cook': 'Повар',
      'Delivery': 'Доставка',
      'Driver': 'Водитель',
      'Admin': 'Администратор',
    };
    return roleMap[role] || role;
  };

  const mapShift = (s: any): Shift => {
    const startTime = s.startTime || s.start;
    const endTime = s.endTime || s.end;
    const rawComment = s.comment || '';
    const exchangeDeclined = rawComment.includes(EXCHANGE_DECLINED_MARKER);
    const comment = rawComment.replace(EXCHANGE_DECLINED_MARKER, '').trim() || undefined;
    
    if (!startTime || !endTime) {
      return {
        id: s.id,
        userId: s.userId,
        employeeId: s.employeeId,
        employeeName: s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : undefined,
      exchangeTargetEmployeeId: s.exchangeTargetEmployeeId,
        date: 'Неизвестная дата',
        dayOfWeek: 'Неизвестный день',
        startTime: '--:--',
        endTime: '--:--',
        location: s.comment || '',
        position: translateRole(s.role || ''),
        status: (s.status || '').toLowerCase(),
        type: s.type,
        comment,
        maxParticipants: s.maxParticipants,
        currentParticipants: s.currentParticipants || 0,
        exchangeDeclined,
      };
    }
    
    let start, end;
    try {
      start = new Date(startTime);
      end = new Date(endTime);
    } catch {
      return {
        id: s.id,
        // ... (те же поля по умолчанию, что и выше, для краткости)
        userId: s.userId, employeeId: s.employeeId,
        employeeName: s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : undefined,
        exchangeTargetEmployeeId: s.exchangeTargetEmployeeId,
        date: 'Неизвестная дата', dayOfWeek: 'Неизвестный день',
        startTime: '--:--', endTime: '--:--', location: s.comment || '',
        position: translateRole(s.role || ''), status: (s.status || '').toLowerCase(),
        type: s.type, comment, maxParticipants: s.maxParticipants, currentParticipants: s.currentParticipants || 0, exchangeDeclined,
      };
    }
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        id: s.id,
        userId: s.userId, employeeId: s.employeeId,
        employeeName: s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : undefined,
        exchangeTargetEmployeeId: s.exchangeTargetEmployeeId,
        date: 'Неизвестная дата', dayOfWeek: 'Неизвестный день',
        startTime: '--:--', endTime: '--:--', location: s.comment || '',
        position: translateRole(s.role || ''), status: (s.status || '').toLowerCase(),
        type: s.type, comment, maxParticipants: s.maxParticipants, currentParticipants: s.currentParticipants || 0, exchangeDeclined,
      };
    }
    
    const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
    
    const startTimeStr = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTimeStr = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    return {
      id: s.id,
      userId: s.userId,
      employeeId: s.employeeId,
      employeeName: s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : undefined,
      exchangeTargetEmployeeId: s.exchangeTargetEmployeeId,
      date: start.toLocaleDateString('ru-RU'),
      dayOfWeek: days[start.getDay()],
      startTime: startTimeStr,
      endTime: endTimeStr,
      fullStartTime: start.toISOString(),
      fullEndTime: end.toISOString(),
      location: s.comment || '',
      position: translateRole(s.role || ''),
      status: (s.status || '').toLowerCase(),
      type: s.type,
      createdBy: s.createdBy,
      comment,
      maxParticipants: s.maxParticipants,
      currentParticipants: s.currentParticipants || 0,
      exchangeDeclined,
    };
  };

  const refreshShifts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/shifts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mappedShifts = data.map(mapShift);
        
        const now = new Date();
        const filteredShifts = mappedShifts.filter((shift: Shift) => {
          if (!shift.fullEndTime) return true; 
          const endTime = new Date(shift.fullEndTime);
          return showPastShifts ? endTime < now : endTime >= now;
        });
        
        setShifts(filteredShifts);
        if (user?.role === 'Employee' && user.employeeId) {
          await checkAcceptedExchanges(user.employeeId);
        }
      } else {
        const json = await res.json().catch(() => null);
        toast.error(json?.message || 'Не удалось загрузить смены');
        setShifts([]);
      }
    } catch (err) {
      toast.error('Не удалось загрузить смены');
    } finally {
      setLoading(false);
    }
  };

  const checkAcceptedExchanges = async (employeeId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/shifts/exchange/accepted?employeeId=${encodeURIComponent(employeeId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const acceptedShifts = (await res.json()).map(mapShift);
        if (Array.isArray(acceptedShifts)) {
          const seenRaw = exchangeSeenStorageKey ? sessionStorage.getItem(exchangeSeenStorageKey) : null;
          const seenFromStorage = seenRaw ? JSON.parse(seenRaw) : [];
          if (Array.isArray(seenFromStorage) && seenFromStorage.length > 0 && shownExchangeAcceptedRef.current.length === 0) {
            shownExchangeAcceptedRef.current = seenFromStorage;
          }

          // Используем ref, чтобы всегда иметь доступ к свежему массиву
          const newNotifications = acceptedShifts.filter((shift: any) => {
            const acceptedById = shift.employeeId;
            if (acceptedById && acceptedById === employeeId) return false;
            return !shownExchangeAcceptedRef.current.includes(shift.id);
          });
          if (newNotifications.length > 0) {
            newNotifications.forEach((shift: any) => {
              const acceptedBy = shift.employeeName || 'сотрудник';
              toast.success(`Обмен принят: смена ${shift.date} ${shift.startTime}-${shift.endTime} принята ${acceptedBy}.`);
            });
            // Обновляем ref
            shownExchangeAcceptedRef.current = [
              ...shownExchangeAcceptedRef.current, 
              ...newNotifications.map((shift: any) => shift.id)
            ];
            if (exchangeSeenStorageKey) {
              sessionStorage.setItem(exchangeSeenStorageKey, JSON.stringify(shownExchangeAcceptedRef.current));
            }
          }
        }
      }
    } catch (err) {
      console.error('Не удалось получить принятые запросы на обмен:', err);
    }
  };

  useEffect(() => {
    refreshShifts();
    loadAvailableRoles();
    loadEmployees();
  // Передаем примитивы user?.id, user?.role вместо объекта user, чтобы избежать бесконечных рендеров
  }, [token, user?.id, user?.role, showPastShifts]);

  useEffect(() => {
    if (user?.role === 'Employee' && user.employeeId) {
      const intervalId = setInterval(() => {
        checkAcceptedExchanges(user.employeeId!);
      }, 15000);
      return () => clearInterval(intervalId);
    }
  }, [token, user?.role, user?.employeeId]);

  useEffect(() => {
    if (!exchangeSeenStorageKey) return;
    const seenRaw = sessionStorage.getItem(exchangeSeenStorageKey);
    if (!seenRaw) return;
    try {
      const parsed = JSON.parse(seenRaw);
      if (Array.isArray(parsed)) {
        shownExchangeAcceptedRef.current = parsed;
      }
    } catch {
      // ignore invalid storage payload
    }
  }, [exchangeSeenStorageKey]);

  const loadAvailableRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/shifts/available-roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAvailableRoles(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEmployees(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'var(--status-confirmed)';
      case 'pending': return 'var(--status-pending)';
      case 'conflict': return 'var(--status-conflict)';
      case 'draft': return 'var(--status-draft)';
      case 'rejected': return 'var(--status-rejected)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'Подтверждена';
      case 'pending': return 'На рассмотрении';
      case 'conflict': return 'Конфликт';
      case 'draft': return 'Черновик';
      case 'rejected': return 'Отклонена';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <Check className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'conflict':
      case 'rejected': return <X className="w-4 h-4" />;
      case 'draft': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getEmployeeNameById = (employeeId?: string) => {
    if (!employeeId) return undefined;
    const employee = employees.find((item) => item.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : undefined;
  };

  const handleRequestReplace = async () => {
    if (!token || !selectedShift) return;
    if (!confirmForEmployee('Подтвердить отправку запроса на обмен сменой?')) return;
    if (!exchangeTargetEmployeeId) {
      toast.error('Выберите сотрудника для обмена');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/shifts/${selectedShift.id}/exchange-request`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetEmployeeId: exchangeTargetEmployeeId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(()=>{}))?.message || 'Не удалось отправить запрос');
      toast.success('Запрос на обмен отправлен!');
      setShowReplaceModal(false);
      setExchangeTargetEmployeeId('');
      setSelectedShift(null);
      refreshShifts();
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось отправить запрос на обмен');
    }
  };

  const [payrollLoadingShiftId, setPayrollLoadingShiftId] = useState<string | null>(null);

  const handleSubmitDraft = async (shiftId: string) => {
    if (!token) return;
    if (!confirmForEmployee('Подтвердить отправку смены на утверждение?')) return;
    try {
      await fetch(`${API_URL}/shifts/${shiftId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'pending' }),
      });
      toast.success('Смена отправлена на утверждение!');
      refreshShifts();
    } catch {
      toast.error('Не удалось отправить смену');
    }
  };

  const handleCreatePayrollDraft = async (shiftId: string) => {
    if (!token) return;
    setPayrollLoadingShiftId(shiftId);
    try {
      const res = await fetch(`${API_URL}/shifts/${shiftId}/payroll-draft`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(()=>{}))?.message || 'Ошибка');
      toast.success('Черновик расчета зарплаты создан');
      refreshShifts();
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось создать расчет зарплаты');
    } finally {
      setPayrollLoadingShiftId(null);
    }
  };

  const handleCreateShift = async () => {
    if (!confirmForEmployee('Подтвердить создание смены?')) return;
    if (!token || !newDate || !newStart || !newEnd || !newRole) {
      return toast.error('Заполните все поля');
    }

    const startDateTime = new Date(`${newDate}T${newStart}`);
    let endDateTime = new Date(`${newDate}T${newEnd}`);

    // Логика ночной смены
    if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1);
    
    if (startDateTime <= new Date()) return toast.error('Дата и время смены должны быть в будущем');

    try {
      const payload = cleanPayload({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        role: newRole,
        comment: user?.role === 'Employee' ? undefined : newComment,
      });
      
      const res = await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        toast.success('Смена создана!');
        playSound('respect');
        setShowCreateModal(false);
        setNewDate(''); setNewStart(''); setNewEnd(''); setNewRole(''); setNewComment('');
        refreshShifts();
      } else {
        toast.error((await res.json().catch(()=>{}))?.message || `Ошибка ${res.status}`);
      }
    } catch {
      toast.error('Не удалось создать смену');
    }
  };

  const handleAssignShift = async () => {
    if (!token || !assignEmployeeId || !assignDate || !assignStart || !assignEnd || !assignRole) {
      return toast.error('Заполните все поля');
    }

    const startDateTime = new Date(`${assignDate}T${assignStart}`);
    let endDateTime = new Date(`${assignDate}T${assignEnd}`);
    
    // Логика ночной смены
    if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1);
    if (startDateTime <= new Date()) return toast.error('Дата и время смены должны быть в будущем');

    try {
      const payload = cleanPayload({
        employeeId: assignEmployeeId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        role: assignRole,
        type: isMandatory ? 'Mandatory' : 'Optional',
        canDecline: !isMandatory,
      });

      const res = await fetch(`${API_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Смена назначена!');
        playSound('respect');
        setShowAssignModal(false);
        setAssignEmployeeId(''); setAssignDate(''); setAssignStart(''); setAssignEnd(''); setAssignRole(''); setIsMandatory(false);
        refreshShifts();
      } else {
        toast.error((await res.json().catch(()=>{}))?.message || `Ошибка ${res.status}`);
      }
    } catch {
      toast.error('Не удалось назначить смену');
    }
  };

  const handleAcceptShift = async (shiftId: string, shiftType?: string) => {
    if (!token) return;
    if (!confirmForEmployee(`Подтвердить действие: ${shiftType === 'Requested' ? 'принять обмен' : 'принять смену'}?`)) return;
    try {
      const url = shiftType === 'Requested' ? `${API_URL}/shifts/${shiftId}/exchange-accept` : `${API_URL}/shifts/${shiftId}/accept`;
      const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }});
      if (res.ok) {
        toast.success('Смена принята!');
        refreshShifts();
      } else toast.error((await res.json().catch(()=>{}))?.message || 'Не удалось принять смену');
    } catch {
      toast.error('Не удалось принять смену');
    }
  };

  const handleDeclineExchange = async (shiftId: string) => {
    if (!token) return;
    if (!confirmForEmployee('Подтвердить отказ от обмена?')) return;
    try {
      const res = await fetch(`${API_URL}/shifts/${shiftId}/exchange-decline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Обмен отклонён. Смена возвращена исходному сотруднику.');
        refreshShifts();
      } else {
        toast.error((await res.json().catch(()=>{}))?.message || 'Не удалось отклонить обмен');
      }
    } catch {
      toast.error('Не удалось отклонить обмен');
    }
  };

  const handleAcceptAssignedShift = async (shiftId: string) => {
    if (!token) return;
    if (!confirmForEmployee('Подтвердить принятие назначенной смены?')) return;
    try {
      const res = await fetch(`${API_URL}/shifts/${shiftId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'Confirmed' }),
      });
      if (res.ok) { toast.success('Смена принята!'); refreshShifts(); }
      else toast.error((await res.json().catch(()=>{}))?.message || 'Не удалось принять смену');
    } catch { toast.error('Не удалось принять смену'); }
  };

  const handleRejectAssignedShift = async (shiftId: string) => {
    if (!token) return;
    if (!confirmForEmployee('Подтвердить отказ от назначенной смены?')) return;
    try {
      const res = await fetch(`${API_URL}/shifts/${shiftId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'Rejected' }),
      });
      if (res.ok) { toast.success('Смена отклонена!'); refreshShifts(); }
      else toast.error((await res.json().catch(()=>{}))?.message || 'Не удалось отклонить смену');
    } catch { toast.error('Не удалось отклонить смену'); }
  };

  const handleApproveShift = async (shiftId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/shifts/${shiftId}/approve`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success('Смена одобрена!'); refreshShifts(); }
      else toast.error((await res.json().catch(()=>{}))?.message || 'Не удалось одобрить смену');
    } catch { toast.error('Не удалось одобрить смену'); }
  };

  const handleRejectRequestedShift = async (shiftId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/shifts/${shiftId}/reject`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success('Смена отклонена!'); refreshShifts(); }
      else toast.error((await res.json().catch(()=>{}))?.message || 'Не удалось отклонить смену');
    } catch { toast.error('Не удалось отклонить смену'); }
  };

  const handleCreateOpenShift = async () => {
    if (!token || !openDate || !openStart || !openEnd || !openRole || !maxParticipants) {
      return toast.error('Заполните все поля');
    }

    const startDateTime = new Date(`${openDate}T${openStart}`);
    let endDateTime = new Date(`${openDate}T${openEnd}`);
    
    if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1);
    if (startDateTime <= new Date()) return toast.error('Дата и время смены должны быть в будущем');

    try {
      const payload = {
        startTime: startDateTime.toISOString(), endTime: endDateTime.toISOString(),
        role: openRole, maxParticipants, type: 'Optional', canDecline: true,
      };
      const res = await fetch(`${API_URL}/shifts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Открытая смена создана!');
        playSound('respect');
        setShowOpenShiftModal(false);
        setOpenDate(''); setOpenStart(''); setOpenEnd(''); setOpenRole(''); setMaxParticipants(1);
        refreshShifts();
      } else toast.error((await res.json().catch(()=>{}))?.message || `Ошибка ${res.status}`);
    } catch { toast.error('Не удалось создать смену'); }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/shifts/${shiftId}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Смена удалена!');
        setShiftToDelete(null);
        refreshShifts();
      }
      else toast.error((await res.json().catch(()=>{}))?.message || 'Не удалось удалить смену');
    } catch { toast.error('Не удалось удалить смену'); }
  };

  const handleStartEdit = (shift: any) => {
    setEditingShiftId(shift.id);
    setEditRole(shift.role || '');
    setEditStart(shift.startTime || '');
    setEditEnd(shift.endTime || '');
    setEditComment(shift.comment || '');
    setShowEditModal(true);
  };

  const handleEditShift = async () => {
    if (!token || !editingShiftId || !editRole || !editStart || !editEnd) {
      return toast.error('Заполните все поля');
    }

    const shiftToEdit = shifts.find((shift) => shift.id === editingShiftId);
    if (!shiftToEdit || !shiftToEdit.fullStartTime) return toast.error('Смена не найдена');

    // Безопасно достаем YYYY-MM-DD из существующего ISO, обходя локальные форматы DD.MM.YYYY
    const datePart = shiftToEdit.fullStartTime.split('T')[0];
    const startDateTime = new Date(`${datePart}T${editStart}:00`);
    let endDateTime = new Date(`${datePart}T${editEnd}:00`);

    // Поддержка ночных смен при редактировании
    if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1);

    try {
      const payload = {
        role: editRole, comment: editComment,
        startTime: startDateTime.toISOString(), endTime: endDateTime.toISOString(),
      };
      const res = await fetch(`${API_URL}/shifts/${editingShiftId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Смена обновлена!');
        setShowEditModal(false); setEditingShiftId(null);
        refreshShifts();
      } else toast.error((await res.json().catch(()=>{}))?.message || `Ошибка ${res.status}`);
    } catch { toast.error('Не удалось обновить смену'); }
  };

  return (
    <div className="min-h-screen w-full dust-effect" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/home')}
                className="p-2 rounded-full glass hover-red-glow"
              >
                <ArrowLeft className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </motion.button>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                {showPastShifts ? 'Прошедшие смены' : 'График смен'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {user?.role === 'Employee' ? (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
                  style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff' }}
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden md:inline">Предложить смену</span>
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
                    style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff' }}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">Добавить смену сотруднику</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowOpenShiftModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
                    style={{ backgroundColor: 'var(--status-confirmed)', color: '#ffffff' }}
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden md:inline">Добавить смену</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading && <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>Загрузка...</div>}
        
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4 card-shadow text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--status-confirmed)', fontFamily: 'var(--font-heading)' }}>
              {shifts.filter(s => {
                const isPast = s.fullEndTime && new Date(s.fullEndTime) < new Date();
                return s.status === 'confirmed' && (showPastShifts ? isPast : !isPast);
              }).length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Подтверждено</div>
          </div>
          <div className="glass rounded-xl p-4 card-shadow text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--status-pending)', fontFamily: 'var(--font-heading)' }}>
              {shifts.filter(s => {
                const isPast = s.fullEndTime && new Date(s.fullEndTime) < new Date();
                return s.status === 'pending' && (showPastShifts ? isPast : !isPast);
              }).length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>На рассмотрении</div>
          </div>
          <div className="glass rounded-xl p-4 card-shadow text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--status-draft)', fontFamily: 'var(--font-heading)' }}>
              {shifts.filter(s => {
                const isPast = s.fullEndTime && new Date(s.fullEndTime) < new Date();
                return s.status === 'draft' && (showPastShifts ? isPast : !isPast);
              }).length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Черновик</div>
          </div>
          <div className="glass rounded-xl p-4 card-shadow text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-heading)' }}>
              {shifts.filter(s => {
                const isPast = s.fullEndTime && new Date(s.fullEndTime) < new Date();
                return showPastShifts ? isPast : !isPast;
              }).length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Всего смен</div>
          </div>
        </motion.div>

        {/* Tabs for Active/Past Shifts */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mb-6">
          <button
            onClick={() => setShowPastShifts(false)}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${!showPastShifts ? 'glass card-shadow' : 'hover:bg-white/5'}`}
            style={{
              backgroundColor: !showPastShifts ? 'var(--glass-bg)' : 'transparent',
              color: 'var(--text-primary)',
              border: !showPastShifts ? '1px solid var(--glass-border)' : 'none'
            }}
          >
            Активные смены
          </button>
          <button
            onClick={() => setShowPastShifts(true)}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${showPastShifts ? 'glass card-shadow' : 'hover:bg-white/5'}`}
            style={{
              backgroundColor: showPastShifts ? 'var(--glass-bg)' : 'transparent',
              color: 'var(--text-primary)',
              border: showPastShifts ? '1px solid var(--glass-border)' : 'none'
            }}
          >
            Прошедшие смены
          </button>
        </motion.div>

          <>
            {/* Shifts List */}
            <div className="space-y-4">
          <AnimatePresence>
            {shifts.map((shift, index) => (
              <motion.div
                key={shift.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }}
                className="glass rounded-2xl p-6 card-shadow cursor-pointer hover-red-glow relative overflow-hidden"
                onClick={() => setSelectedShift(shift)}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: getStatusColor(shift.status) }} />
                {(shift.status === 'rejected' || shift.status === 'conflict') && (
                  <div className="absolute inset-0 opacity-10" style={{ backgroundColor: getStatusColor(shift.status) }} />
                )}

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: getStatusColor(shift.status) }}>
                          <CalendarIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{shift.dayOfWeek}</h3>
                          <p style={{ color: 'var(--text-secondary)' }}>{shift.date}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{shift.startTime} - {shift.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{shift.position}</span>
                        </div>
                        {shift.employeeName && (user?.role === 'HR' || user?.role === 'Admin') && (
                          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Работник: {shift.employeeName}</div>
                        )}
                        {shift.type === 'Requested' && getEmployeeNameById(shift.exchangeTargetEmployeeId) && (
                          <div className="text-xs mt-1" style={{ color: 'var(--accent-primary)' }}>
                            Предложено: {getEmployeeNameById(shift.exchangeTargetEmployeeId)}
                          </div>
                        )}
                        {shift.type === 'Requested' && shift.createdBy === user?.id && shift.status === 'pending' && (
                          <div className="text-xs mt-1" style={{ color: 'var(--status-pending)' }}>
                            На рассмотрении
                          </div>
                        )}
                        {shift.exchangeDeclined && shift.employeeId === user?.employeeId && (
                          <div className="text-xs mt-1" style={{ color: '#ffb703' }}>
                            Обмен отклонён. Смена снова закреплена за вами.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full font-medium" style={{ backgroundColor: `${getStatusColor(shift.status)}20`, color: getStatusColor(shift.status) }}>
                        {getStatusIcon(shift.status)} {getStatusText(shift.status)}
                      </div>

                      {shift.maxParticipants && (
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {shift.maxParticipants === 1 
                            ? (shift.currentParticipants === 0 ? '⚠️ Одно место' : '✓ Место занято')
                            : `Мест: ${shift.maxParticipants - (shift.currentParticipants || 0)} из ${shift.maxParticipants}`
                          }
                        </div>
                      )}

                      <div className="flex gap-2">
                        {showPastShifts ? (
                          (user?.role === 'HR' || user?.role === 'Admin' || user?.role === 'Manager') && shift.status === 'confirmed' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); handleCreatePayrollDraft(shift.id); }}
                              className="px-4 py-2 rounded-xl text-sm font-medium"
                              disabled={payrollLoadingShiftId === shift.id}
                              style={{ backgroundColor: 'rgba(6, 146, 206, 0.2)', color: '#064e7b', border: '1px solid #0ea5e9' }}
                            >
                              {payrollLoadingShiftId === shift.id ? 'Создание...' : 'Черновик зарплаты'}
                            </motion.button>
                          )
                        ) : (
                          <>
                            {shift.status === 'draft' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); handleSubmitDraft(shift.id); }}
                                className="px-4 py-2 rounded-xl text-sm font-medium"
                                style={{ backgroundColor: 'var(--status-confirmed)', color: '#ffffff' }}
                              >
                                <Send className="w-4 h-4" />
                              </motion.button>
                            )}
                            {!shift.employeeId && user?.role === 'Employee' && (shift.maxParticipants ? (shift.currentParticipants || 0) < shift.maxParticipants : true) && (shift.type !== 'Requested' || shift.createdBy !== user?.id) && (
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); handleAcceptShift(shift.id, shift.type); }}
                                  className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                                  style={{ backgroundColor: 'var(--status-confirmed)', color: '#ffffff' }}
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="hidden md:inline">{shift.type === 'Requested' ? 'Принять обмен' : 'Принять'}</span>
                                </motion.button>
                                {shift.type === 'Requested' && shift.exchangeTargetEmployeeId === user?.employeeId && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); handleDeclineExchange(shift.id); }}
                                    className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                                    style={{ backgroundColor: '#ff6b6b', color: '#ffffff' }}
                                  >
                                    <X className="w-4 h-4" />
                                    <span className="hidden md:inline">Отказаться</span>
                                  </motion.button>
                                )}
                              </div>
                            )}
                            {shift.status === 'confirmed' && user?.role === 'Employee' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); setSelectedShift(shift); setShowReplaceModal(true); }}
                                className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                                style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--accent-primary)', border: '1px solid var(--glass-border)' }}
                              >
                                <RefreshCw className="w-4 h-4" />
                                <span className="hidden md:inline">Обменять</span>
                              </motion.button>
                            )}
                            {user?.role === 'Employee' && shift.status === 'pending' && shift.employeeId === user?.employeeId && shift.type !== 'Requested' && (
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); handleAcceptAssignedShift(shift.id); }}
                                  className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                                  style={{ backgroundColor: 'var(--status-confirmed)', color: '#ffffff' }}
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="hidden md:inline">Принять</span>
                                </motion.button>
                                {shift.type === 'Optional' && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); handleRejectAssignedShift(shift.id); }}
                                    className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                                    style={{ backgroundColor: '#ff6b6b', color: '#ffffff' }}
                                  >
                                    <X className="w-4 h-4" />
                                    <span className="hidden md:inline">Отказать</span>
                                  </motion.button>
                                )}
                              </div>
                            )}
                            {(user?.role === 'Admin' || user?.role === 'HR') && shift.type === 'Requested' && shift.status === 'pending' && (
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); handleApproveShift(shift.id); }}
                                  className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                                  style={{ backgroundColor: 'var(--status-confirmed)', color: '#ffffff' }} title="Одобрить"
                                >
                                  <Check className="w-4 h-4" /> <span className="hidden md:inline">Одобрить</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); handleRejectRequestedShift(shift.id); }}
                                  className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                                  style={{ backgroundColor: '#ff6b6b', color: '#ffffff' }} title="Отклонить"
                                >
                                  <X className="w-4 h-4" /> <span className="hidden md:inline">Отклонить</span>
                                </motion.button>
                              </div>
                            )}
                            {!showPastShifts && (user?.role === 'HR' || user?.role === 'Admin') && (
                              <div className="flex gap-2 ml-auto">
                                <motion.button
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); handleStartEdit(shift); }}
                                  className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1" title="Редактировать"
                                  style={{ backgroundColor: 'var(--accent-primary)20', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); setShiftToDelete(shift); }}
                                  className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1" title="Удалить"
                                  style={{ backgroundColor: '#ff333320', color: '#ff3333', border: '1px solid #ff3333' }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        </>
      </div>

      {/* Модалки (Edit, Replace, Create, Assign, Open Shift) */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="glass rounded-3xl border-0 card-shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Редактировать смену</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>Обновите детали смены</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Роль</label>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full px-4 py-2 rounded-xl glass border" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
                <option value="">Выберите роль</option>
                {availableRoles.map(role => <option key={role} value={role}>{translateRole(role)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Начало</label>
                <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="w-full px-4 py-2 rounded-xl glass border" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Конец</label>
                <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="w-full px-4 py-2 rounded-xl glass border" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Комментарий</label>
              <textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} className="w-full px-4 py-2 rounded-xl glass border" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }} rows={3} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleEditShift} className="flex-1" style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff' }}>Сохранить</Button>
              <Button onClick={() => { setShowEditModal(false); setEditingShiftId(null); }} variant="outline" className="flex-1">Отмена</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReplaceModal} onOpenChange={setShowReplaceModal}>
        <DialogContent className="glass rounded-3xl border-0 card-shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Обмен сменой</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>Хотите обменяться сменой с коллегами?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedShift && (
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedShift.dayOfWeek}, {selectedShift.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedShift.startTime} - {selectedShift.endTime}</span>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                Кому предложить смену
              </label>
              <select
                value={exchangeTargetEmployeeId}
                onChange={(e) => setExchangeTargetEmployeeId(e.target.value)}
                className="w-full p-2 rounded-lg glass border text-black"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                <option value="">Выберите сотрудника</option>
                {employees
                  .filter((emp) => emp.id !== user?.employeeId)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowReplaceModal(false); setExchangeTargetEmployeeId(''); }} className="flex-1">Отмена</Button>
              <Button onClick={handleRequestReplace} className="flex-1" style={{ backgroundColor: 'var(--accent-primary)' }}>
                <Users className="w-4 h-4 mr-2" /> Отправить запрос
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="glass rounded-3xl border-0 card-shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Предложить смену</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="glass rounded-xl p-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Дата</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-4">
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Начало</label>
                  <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
                </div>
                <div className="glass rounded-xl p-4">
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Конец</label>
                  <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>Роль / позиция</label>
                {user?.role === 'Employee' ? (
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }}>
                    <option value="">Выберите роль</option>
                    {availableRoles.map(role => <option key={role} value={role}>{translateRole(role)}</option>)}
                  </select>
                ) : (
                  <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Повар" className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
                )}
              </div>
              {user?.role !== 'Employee' && (
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>Комментарий</label>
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Центральная" className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Отмена</Button>
              <Button onClick={handleCreateShift} className="flex-1" style={{ backgroundColor: 'var(--accent-primary)' }}>Создать черновик</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="glass rounded-3xl border-0 card-shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Назначить смену</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="glass rounded-xl p-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Сотрудник</label>
                <select value={assignEmployeeId} onChange={(e) => setAssignEmployeeId(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }}>
                  <option value="">Выберите сотрудника</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                </select>
              </div>
              <div className="glass rounded-xl p-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Дата</label>
                <input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-4">
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Начало</label>
                  <input type="time" value={assignStart} onChange={(e) => setAssignStart(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
                </div>
                <div className="glass rounded-xl p-4">
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Конец</label>
                  <input type="time" value={assignEnd} onChange={(e) => setAssignEnd(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Роль</label>
                <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }}>
                  <option value="">Выберите роль</option>
                  {availableRoles.map(role => <option key={role} value={role}>{translateRole(role)}</option>)}
                </select>
              </div>
              <div className="glass rounded-xl p-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} />
                  <span style={{ color: 'var(--text-primary)' }}>Обязательная смена</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAssignModal(false)} className="flex-1">Отмена</Button>
              <Button onClick={handleAssignShift} className="flex-1" style={{ backgroundColor: 'var(--accent-primary)' }}>Назначить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOpenShiftModal} onOpenChange={setShowOpenShiftModal}>
        <DialogContent className="glass rounded-3xl border-0 card-shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Открытая смена</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="glass rounded-xl p-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Дата</label>
                <input type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-4">
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Начало</label>
                  <input type="time" value={openStart} onChange={(e) => setOpenStart(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
                </div>
                <div className="glass rounded-xl p-4">
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Конец</label>
                  <input type="time" value={openEnd} onChange={(e) => setOpenEnd(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Роль</label>
                <select value={openRole} onChange={(e) => setOpenRole(e.target.value)} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }}>
                  <option value="">Выберите роль</option>
                  {availableRoles.map(role => <option key={role} value={role}>{translateRole(role)}</option>)}
                </select>
              </div>
              <div className="glass rounded-xl p-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>Свободные места</label>
                <input type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} className="w-full p-2 rounded-lg glass border text-black" style={{ borderColor: 'var(--glass-border)' }} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowOpenShiftModal(false)} className="flex-1">Отмена</Button>
              <Button onClick={handleCreateOpenShift} className="flex-1" style={{ backgroundColor: 'var(--status-confirmed)' }}>Создать</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shiftToDelete} onOpenChange={(open) => !open && setShiftToDelete(null)}>
        <DialogContent className="glass rounded-3xl border-0 card-shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Удалить смену</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              Это действие нельзя отменить. Смена будет удалена из расписания.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {shiftToDelete && (
              <div className="glass rounded-xl p-4" style={{ color: 'var(--text-primary)' }}>
                <div>{shiftToDelete.dayOfWeek}, {shiftToDelete.date}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {shiftToDelete.startTime} - {shiftToDelete.endTime} · {shiftToDelete.position}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShiftToDelete(null)} className="flex-1">Отмена</Button>
              <Button
                onClick={() => shiftToDelete && handleDeleteShift(shiftToDelete.id)}
                className="flex-1"
                style={{ backgroundColor: '#ff3333', color: '#ffffff' }}
              >
                Удалить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}