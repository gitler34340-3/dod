import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { 
  Bell, 
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Crown,
  Calendar,
  FileText,
  TrendingUp,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { ArthurMorganAvatar } from '@/app/components/ArthurMorganAvatar';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { SalaryBlock } from '@/app/components/SalaryBlock';
import { InteractiveStats } from '@/app/components/InteractiveStats';
import { ShiftsDistributionChart } from '@/app/components/charts/ShiftsDistributionChart';
import { KPIChart } from '@/app/components/charts/KPIChart';
import { CharacterCard } from '@/app/components/CharacterCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { apiFetch } from '@/app/api/api';
import { StoriesViewerModal, type FeedStory } from '@/app/components/StoriesViewerModal';
import { CreateStoryModal } from '@/app/components/CreateStoryModal';
import { playSound } from '@/app/audio/sounds';
import {
  getAppNotifications,
  subscribeToAppNotifications,
  type AppNotification,
} from '@/app/notifications/appNotifications';

interface Shift {
  id: string;
  date: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'draft' | 'rejected';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
}

const isVideoSource = (url: string) =>
  url.startsWith('data:video/') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

export function DashboardScreen() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, token, isHr } = useAuth();

  type EmployeeRow = {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    hireDate: string;
    salary: number;
    department?: { id: string; name: string; code: string } | null;
    avatar?: { fileUrl?: string | null; notes?: string | null } | null;
    canPublishStories?: boolean;
  };

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeeOfMonth, setEmployeeOfMonth] = useState<{
    employee: { firstName: string; lastName: string };
    message?: string | null;
    month: number;
    year: number;
  } | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [actionNotifications, setActionNotifications] = useState<AppNotification[]>(() => getAppNotifications());
  const [documentsCount, setDocumentsCount] = useState(0);
  const [documentsTotal, setDocumentsTotal] = useState(0);
  const [documentsPercent, setDocumentsPercent] = useState(0);
  const [achievementCount, setAchievementCount] = useState(0);
  const [attendanceHours, setAttendanceHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [storiesProgress, setStoriesProgress] = useState<Record<string, number>>({});
  const [feedStories, setFeedStories] = useState<FeedStory[]>([]);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [storiesCreateOpen, setStoriesCreateOpen] = useState(false);
  const [viewerStories, setViewerStories] = useState<FeedStory[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  useEffect(() => {
    return subscribeToAppNotifications((notification) => {
      setActionNotifications((current) => [notification, ...current].slice(0, 30));
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    setEmployeesLoading(true);
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const shiftTypeLabel = (isoStart?: string) => {
      if (!isoStart) return 'Смена';
      const hour = new Date(isoStart).getHours();
      if (hour < 12) return 'Утренняя';
      if (hour < 17) return 'Дневная';
      if (hour < 22) return 'Вечерняя';
      return 'Ночная';
    };

    Promise.all([
      apiFetch<EmployeeRow[]>('/employees', undefined, token).catch(() => []),
      apiFetch('/employees/employee-of-month/current', undefined, token).catch(() => null),
      apiFetch<any[]>('/shifts', undefined, token).catch(() => []),
      apiFetch<any[]>(
        `/attendance${user?.employeeId ? `?employeeId=${encodeURIComponent(user.employeeId)}&` : '?'}from=${formatDate(weekAgo)}&to=${formatDate(today)}`,
        undefined,
        token,
      ).catch(() => []),
      apiFetch<any[]>('/achievements', undefined, token).catch(() => []),
      (user?.role === 'Employee'
        ? apiFetch<any[]>('/employee-documents/required', undefined, token)
        : apiFetch<any[]>('/employee-documents/admin/all', undefined, token)
      ).catch(() => []),
      apiFetch<FeedStory[]>('/stories', undefined, token).catch(() => []),
    ])
      .then(([employeeRows, employeeOfMonthData, rawShifts, attendanceRows, achievements, documents, stories]) => {
        setEmployees(employeeRows);
        setEmployeeOfMonth(employeeOfMonthData as typeof employeeOfMonth);
        setAchievementCount(Array.isArray(achievements) ? achievements.length : 0);
        const docsArr = Array.isArray(documents) ? documents : [];
        let documentsNotificationCount = docsArr.length;
        let documentsNotificationTotal = docsArr.length;
        let documentsNotificationPercent = 0;
        if (user?.role === 'Employee') {
          const requiredTotal = docsArr.length;
          const done = docsArr.filter((d: any) => ['submitted', 'approved', 'completed'].includes(String(d?.submission?.status || ''))).length;
          const missing = Math.max(0, requiredTotal - done);
          documentsNotificationCount = missing;
          documentsNotificationTotal = requiredTotal;
          documentsNotificationPercent = requiredTotal > 0 ? Math.round((done / requiredTotal) * 100) : 0;
          setDocumentsTotal(requiredTotal);
          setDocumentsCount(missing);
          setDocumentsPercent(documentsNotificationPercent);
        } else {
          documentsNotificationPercent = Math.min(100, Math.round(docsArr.length / 2));
          setDocumentsTotal(docsArr.length);
          setDocumentsCount(docsArr.length);
          setDocumentsPercent(documentsNotificationPercent);
        }
        setFeedStories(Array.isArray(stories) ? stories : []);

        const normalizedShifts = (Array.isArray(rawShifts) ? rawShifts : [])
          .map((shift) => {
            const start = new Date(shift.startTime || shift.start);
            const end = new Date(shift.endTime || shift.end);
            return {
              id: shift.id,
              start,
              end,
              status: String(shift.status || '').toLowerCase() as Shift['status'],
              employeeId: shift.employeeId,
              type: shift.type,
            };
          })
          .filter((shift) => !Number.isNaN(shift.start.getTime()) && shift.end >= today)
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        const ownOrPrimaryShifts =
          user?.role === 'Employee'
            ? normalizedShifts.filter((shift) => shift.employeeId === user.employeeId)
            : normalizedShifts;

        setUpcomingShifts(
          ownOrPrimaryShifts.slice(0, 4).map((shift) => ({
            id: shift.id,
            date: shift.start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
            time: `${shift.start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}-${shift.end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
            type: shiftTypeLabel(shift.start.toISOString()),
            status: shift.status,
          })),
        );

        const weekAttendance = new Array(7).fill(0);
        (Array.isArray(attendanceRows) ? attendanceRows : []).forEach((row: any) => {
          const date = new Date(row.date);
          if (Number.isNaN(date.getTime())) return;
          const index = (date.getDay() + 6) % 7;
          weekAttendance[index] += Number(row.workHours || 0);
        });
        setAttendanceHours(weekAttendance);

        const nextShift = ownOrPrimaryShifts[0];
        const pendingShiftsCount = ownOrPrimaryShifts.filter((shift) => shift.status === 'pending').length;
        const generatedNotifications: Notification[] = [];
        if (nextShift) {
          generatedNotifications.push({
            id: 'next-shift',
            title: 'Ближайшая смена',
            message: `${nextShift.start.toLocaleDateString('ru-RU')} ${nextShift.start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}-${nextShift.end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
            type: 'info',
            time: 'актуально сейчас',
          });
        }
        if (pendingShiftsCount > 0) {
          generatedNotifications.push({
            id: 'pending-shifts',
            title: 'Смены на рассмотрении',
            message: `Ожидают решения: ${pendingShiftsCount}`,
            type: 'warning',
            time: 'сегодня',
          });
        }
        if ((Array.isArray(achievements) ? achievements.length : 0) > 0) {
          generatedNotifications.push({
            id: 'achievements',
            title: 'Достижения',
            message: `В системе доступно достижений: ${achievements.length}`,
            type: 'success',
            time: 'обновлено',
          });
        }
        if ((Array.isArray(documents) ? documents.length : 0) > 0) {
          generatedNotifications.push({
            id: 'documents',
            title: 'Документы',
            message:
              user?.role === 'Employee'
                ? `Требуется закрыть: ${documentsCount} из ${documentsTotal}`
                : `Документов в реестре: ${docsArr.length}`,
            type: 'info',
            time: 'актуально',
          });
        }
        setNotifications([
          ...actionNotifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            time: notification.time,
          })),
          ...generatedNotifications,
        ]);
      })
      .finally(() => setEmployeesLoading(false));
  }, [token, user?.role, actionNotifications]);

  const stats = useMemo(() => {
    const pendingCount = upcomingShifts.filter((shift) => shift.status === 'pending').length;
    const confirmedCount = upcomingShifts.filter((shift) => shift.status === 'confirmed').length;
    const totalHours = attendanceHours.reduce((sum, value) => sum + value, 0);
    const maxHours = attendanceHours.length ? Math.max(...attendanceHours, 1) : 1;
    const kpiValue = Math.min(100, Math.round((totalHours / (maxHours * 7 || 1)) * 100));

    return [
      {
        label: 'Ближайшие смены',
        value: String(upcomingShifts.length),
        icon: <Calendar className="w-5 h-5" />,
        color: 'var(--status-confirmed)',
        description: `Подтверждено: ${confirmedCount}, ожидает: ${pendingCount}`,
        hasChart: true,
        chartType: 'shifts' as const,
      },
      {
        label: 'KPI недели',
        value: `${kpiValue}%`,
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'var(--accent-primary)',
        description: `Учтено рабочих часов за неделю: ${totalHours.toFixed(1)}`,
        hasChart: true,
        chartType: 'kpi' as const,
      },
      {
        label: 'Достижения',
        value: String(achievementCount),
        icon: <Trophy className="w-5 h-5" />,
        color: 'var(--orange-subtle)',
        description: 'Количество достижений, доступных в системе',
      },
      {
        label: 'Документы',
        value: String(documentsCount),
        icon: <FileText className="w-5 h-5" />,
        color: 'var(--text-secondary)',
        description:
          user?.role === 'Employee'
            ? `Требуемые документы • ${documentsPercent}% выполнено`
            : `Документы, доступные администратору • ${documentsPercent}% покрытия`,
      },
    ];
  }, [achievementCount, attendanceHours, documentsCount, documentsPercent, upcomingShifts, user?.role]);

  const shiftsChartData = useMemo(() => {
    const buckets = [0, 0, 0, 0];
    upcomingShifts.forEach((shift) => {
      const hour = Number(shift.time.slice(0, 2));
      if (hour < 12) buckets[0] += 1;
      else if (hour < 17) buckets[1] += 1;
      else if (hour < 22) buckets[2] += 1;
      else buckets[3] += 1;
    });
    return {
      labels: ['Утренние', 'Дневные', 'Вечерние', 'Ночные'],
      values: buckets,
    };
  }, [upcomingShifts]);

  const kpiChartData = useMemo(() => {
    const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const completedTasks = attendanceHours.map((hours) => Math.round(hours));
    const max = Math.max(...attendanceHours, 1);
    const kpiScores = attendanceHours.map((hours) => Math.round((hours / max) * 100));
    return { labels, completedTasks, kpiScores };
  }, [attendanceHours]);

  const teamCards = useMemo(() => {
    const palette = [
      'var(--accent-primary)',
      'var(--orange-subtle)',
      'var(--status-confirmed)',
      'var(--status-pending)',
      'var(--status-conflict)',
    ];
    // filter out the legacy placeholder employee that was seeded by default
    const filtered = employees.filter(e => !(e.firstName === 'Иван' && e.lastName === 'Петров'));
    return filtered.map((e, idx) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: e.department?.name || 'Сотрудник',
      color: palette[idx % palette.length],
      imagePath: e.avatar?.fileUrl || undefined,
    }));
  }, [employees]);

  const currentEmployeeAvatar = useMemo(() => {
    if (!user?.employeeId) return undefined;
    return employees.find((e) => e.id === user.employeeId)?.avatar?.fileUrl || undefined;
  }, [employees, user?.employeeId]);
  const canPublishStories = useMemo(() => {
    if (!user?.role) return false;
    if (['Admin', 'HR', 'Manager'].includes(user.role)) return true;
    const employee = employees.find((item) => item.id === user.employeeId);
    return Boolean(employee?.canPublishStories);
  }, [employees, user?.employeeId, user?.role]);

  const teamStories = useMemo(
    () => feedStories.filter((story) => Boolean(story.employee)).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [feedStories],
  );

  return (
    <div className="min-h-screen w-full dust-effect relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 glass border-b"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* User Avatar */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            {currentEmployeeAvatar ? (
              <motion.img
                src={currentEmployeeAvatar}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover border"
                style={{ borderColor: 'var(--glass-border)' }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(211,47,47,0.55)',
                    '0 0 0 8px rgba(211,47,47,0)',
                    '0 0 0 0 rgba(211,47,47,0)',
                  ],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : (
              <ArthurMorganAvatar />
            )}
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {user?.email ?? 'Пользователь'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isHr ? 'HR / Менеджер' : 'Сотрудник'}
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  playSound('notification');
                  setShowNotifications(!showNotifications);
                }}
                className="relative p-3 rounded-full glass hover-red-glow"
                aria-label="Уведомления"
                title="Уведомления"
              >
                <Bell className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <span 
                  className="absolute top-1 right-1 w-3 h-3 rounded-full border-2"
                  style={{ 
                    backgroundColor: 'var(--accent-primary)',
                    borderColor: 'var(--bg-primary)'
                  }}
                />
              </motion.button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 glass rounded-2xl card-shadow-lg overflow-hidden"
                  style={{ 
                    border: '1px solid var(--glass-border)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  <div className="p-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      Уведомления
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        whileHover={{ backgroundColor: 'var(--glass-bg)' }}
                        className="p-4 cursor-pointer"
                        style={{ borderBottom: '1px solid var(--glass-border)' }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${
                            notif.type === 'success' ? 'text-[var(--status-confirmed)]' : 
                            notif.type === 'warning' ? 'text-[var(--status-pending)]' : 
                            'text-[var(--text-secondary)]'
                          }`}>
                            {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                             notif.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                             <Bell className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {notif.title}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {notif.message}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                              {notif.time}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Profile Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/profile')}
              className="p-3 rounded-full glass hover-red-glow"
            >
              <User className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <h1 
            className="text-4xl md:text-5xl font-bold mb-2"
            style={{ 
              fontFamily: 'var(--font-heading)',
              background: `linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Добро пожаловать на Дикий Запад!
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-lg">
            {new Date().toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Сторис (раздельные)
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStoriesCreateOpen(true)}
              disabled={!canPublishStories}
              className="px-3 py-1 rounded-full text-sm disabled:opacity-60"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-muted)' }}
            >
              {canPublishStories ? '+ Добавить' : 'Публикация закрыта'}
            </motion.button>
          </div>

          <div className="mb-4">
            <button
              type="button"
              onClick={() => navigate('/story')}
              className="glass rounded-2xl p-4 text-left border w-full sm:w-auto"
              style={{ borderColor: 'var(--border-muted)' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Обучающие сторис
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Режим обучения с авто-переходом по вкладкам
              </p>
            </button>
          </div>

          <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Лента сотрудников
          </p>
          <Swiper
            modules={[A11y, Navigation]}
            navigation
            spaceBetween={12}
            slidesPerView="auto"
            className="dashboard-swiper dashboard-swiper--stories"
          >
            {teamStories.slice(0, 20).map((story, index) => {
              const progress = storiesProgress[story.id] ?? 0;
              const label = story.title || (story.employee ? story.employee.firstName : 'История');
              return (
                <SwiperSlide key={`story-${story.id}`} className="dashboard-story-slide">
                  <button
                    type="button"
                    onClick={() => {
                      setStoriesProgress((prev) => ({ ...prev, [story.id]: 100 }));
                      setViewerStories(teamStories.slice(0, 50));
                      setViewerInitialIndex(index);
                      setStoriesOpen(true);
                    }}
                    className="w-full"
                  >
                    <div className="rounded-2xl p-1" style={{ background: `conic-gradient(var(--accent-primary) ${progress}%, var(--glass-bg) ${progress}% 100%)` }}>
                      <div className="rounded-xl overflow-hidden bg-black aspect-square">
                        {isVideoSource(story.mediaUrl) ? (
                          <video
                            src={story.mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img src={story.mediaUrl} alt={label} className="w-full h-full object-cover" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                  </button>
                </SwiperSlide>
              );
            })}
            {feedStories.length === 0 ? (
              <div className="glass rounded-xl p-4" style={{ color: 'var(--text-secondary)' }}>
                Пока нет сторис. Нажмите “Добавить”.
              </div>
            ) : null}
          </Swiper>
        </motion.div>

        {/* Training Banner - Show only if not completed */}
        {false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/story')}
            className="mb-8 glass rounded-3xl p-6 card-shadow-lg cursor-pointer hover-red-glow relative overflow-hidden"
          >
            <div 
              className="absolute inset-0 opacity-10"
              style={{ background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` }}
            />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                >
                  🎯 Пройдите обучение
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Освойте все навыки для работы на Диком Западе
                </p>
              </div>
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-4xl"
              >
                →
              </motion.div>
            </div>
          </motion.div>
        )}

        {employeeOfMonth && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.34 }}
            className="mb-8 glass rounded-3xl p-6 card-shadow-lg relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  <Crown className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                  Работник месяца
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {employeeOfMonth.employee.firstName} {employeeOfMonth.employee.lastName}
                  {employeeOfMonth.message ? ` - ${employeeOfMonth.message}` : ''}
                </p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </motion.div>
        )}

        {/* Salary Block - Full Width, High Priority */}
        {user?.role === 'Employee' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <SalaryBlock />
          </motion.div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Interactive Stats - Takes 2 columns */}
          <div className="lg:col-span-2">
            <InteractiveStats
              stats={stats}
              shiftsChartData={shiftsChartData}
              kpiChartData={kpiChartData}
            />
          </div>

          {/* Upcoming Shifts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-3xl p-6 card-shadow-lg hover-red-glow"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
              >
                Ближайшие смены
              </h3>
              <Clock className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </div>

            <Swiper
              modules={[A11y, Pagination]}
              pagination={{ clickable: true }}
              spaceBetween={12}
              slidesPerView={1}
              className="dashboard-swiper dashboard-swiper--shifts"
            >
              {upcomingShifts.length > 0 ? upcomingShifts.map((shift, index) => (
                <SwiperSlide key={shift.id}>
                <motion.div
                  key={shift.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-xl p-4 cursor-pointer"
                  onClick={() => navigate('/schedule')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {shift.date}
                        </span>
                        <span 
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: shift.status === 'confirmed' 
                              ? 'rgba(76, 175, 80, 0.2)' 
                              : 'rgba(251, 192, 45, 0.2)',
                            color: shift.status === 'confirmed' 
                              ? 'var(--status-confirmed)' 
                              : 'var(--status-pending)'
                          }}
                        >
                          {shift.status === 'confirmed' ? '✓' : '⏳'}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {shift.time}
                      </p>
                    </div>
                    <span 
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: 'var(--glass-bg)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {shift.type}
                    </span>
                  </div>
                </motion.div>
                </SwiperSlide>
              )) : (
                <div className="glass rounded-xl p-4" style={{ color: 'var(--text-secondary)' }}>
                  Ближайших смен пока нет.
                </div>
              )}
            </Swiper>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/schedule')}
              className="w-full mt-4 py-3 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff'
              }}
            >
              Смотреть все смены
            </motion.button>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Shifts Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass rounded-3xl p-6 card-shadow-lg hover-red-glow"
          >
            <h3 
              className="text-xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
            >
              Распределение смен
            </h3>
            <div className="h-64">
              <ShiftsDistributionChart labels={shiftsChartData.labels} values={shiftsChartData.values} />
            </div>
          </motion.div>

          {/* KPI Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="glass rounded-3xl p-6 card-shadow-lg hover-red-glow"
          >
            <h3 
              className="text-xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
            >
              KPI за неделю
            </h3>
            <div className="h-64">
              <KPIChart
                labels={kpiChartData.labels}
                completedTasks={kpiChartData.completedTasks}
                kpiScores={kpiChartData.kpiScores}
              />
            </div>
          </motion.div>
        </div>

        {/* Team (real people) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
            >
              👥 Команда
            </h2>
            <span 
              className="text-sm px-4 py-2 rounded-full glass"
              style={{ color: 'var(--text-secondary)' }}
            >
              Реальные сотрудники
            </span>
          </div>

          {employeesLoading ? (
            <div className="glass rounded-xl p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
              Загрузка команды...
            </div>
          ) : teamCards.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
              Пока нет сотрудников. Создайте сотрудников в HR панели или через API.
            </div>
          ) : (
            <Swiper
              modules={[A11y, Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              spaceBetween={16}
              slidesPerView={2}
              breakpoints={{
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
              }}
              className="dashboard-swiper dashboard-swiper--team"
            >
              {teamCards.map((member, index) => (
                <SwiperSlide key={member.id}>
                <CharacterCard
                  name={member.name}
                  role={member.role}
                  color={member.color}
                  imagePath={member.imagePath}
                  index={index}
                  onClick={() => navigate(`/team/${member.id}`)}
                />
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          {false && <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
            className="mt-6 glass rounded-xl p-4"
          >
            <p 
              className="text-sm text-center"
              style={{ color: 'var(--text-tertiary)' }}
            >
              💡 Кликните на карточку для просмотра профиля сотрудника.
            </p>
          </motion.div>}
        </motion.div>
      </div>

      <StoriesViewerModal
        open={storiesOpen}
        stories={viewerStories}
        initialIndex={viewerInitialIndex}
        token={token}
        isAdmin={Boolean(user?.role && ['Admin', 'HR', 'Manager'].includes(user.role))}
        onClose={() => setStoriesOpen(false)}
      />
      <CreateStoryModal
        open={storiesCreateOpen}
        onClose={() => setStoriesCreateOpen(false)}
        onCreated={async () => {
          if (!token) return;
          const stories = await apiFetch<FeedStory[]>('/stories', undefined, token).catch(() => []);
          setFeedStories(Array.isArray(stories) ? stories : []);
        }}
      />
    </div>
  );
}
