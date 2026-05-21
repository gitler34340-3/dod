import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Award, 
  Calendar, 
  Briefcase,
  Trophy,
  Star,
  Target,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { apiFetch } from '@/app/api/api';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string | null;
  unlocked?: boolean;
  date?: string | null;
}

export function TeamMemberProfile() {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { token } = useAuth();

  type Employee = {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    hireDate: string;
    hourlyRate: number;
    department?: { id: string; name: string; code: string } | null;
    user?: { id: string; email: string; role: string } | null;
    avatar?: { fileUrl?: string | null; notes?: string | null } | null;
  };

  type EmployeeAchievement = {
    id: string;
    earnedAt: string;
    notes?: string | null;
    achievement: {
      id: string;
      title: string;
      description?: string | null;
      icon?: string | null;
      points: number;
    };
  };

  type AttendanceRow = { id: string; date: string; workHours?: number | null; status: string };

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employeeAchievements, setEmployeeAchievements] = useState<EmployeeAchievement[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !employeeId) return;
    setLoading(true);
    Promise.all([
      apiFetch<Employee>(`/employees/${employeeId}`, undefined, token),
      apiFetch<EmployeeAchievement[]>(`/achievements/by-employee/${employeeId}`, undefined, token).catch(() => []),
      apiFetch<AttendanceRow[]>(`/attendance?employeeId=${encodeURIComponent(employeeId)}`, undefined, token).catch(
        () => [],
      ),
    ])
      .then(([emp, ach, att]) => {
        setEmployee(emp);
        setEmployeeAchievements(ach);
        setAttendance(att);
      })
      .finally(() => setLoading(false));
  }, [token, employeeId]);

  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : 'Сотрудник';
  const memberColor = 'var(--accent-primary)';
  const roleLabel = employee?.department?.name || employee?.user?.role || 'Employee';
  const totalDays = attendance.length;
  const totalHours = useMemo(
    () => attendance.reduce((acc, a) => acc + (a.workHours ?? 0), 0),
    [attendance],
  );

  const hourlyRate = employee?.hourlyRate ?? 0;
  const totalSalary = totalHours * hourlyRate;
  const startDate = employee?.hireDate ? new Date(employee.hireDate) : null;
  const monthsInTeam = startDate
    ? Math.max(
        0,
        (new Date().getFullYear() - startDate.getFullYear()) * 12 +
          (new Date().getMonth() - startDate.getMonth()),
      )
    : 0;

  return (
    <div className="min-h-screen w-full dust-effect" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/home')}
            className="p-2 rounded-full glass hover-red-glow"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </motion.button>

          <h1 
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            Профиль сотрудника
          </h1>

          <div className="w-10 h-10" />
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        {loading || !employee ? (
          <div className="glass rounded-2xl p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            Загрузка профиля...
          </div>
        ) : (
        <>
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 card-shadow-lg mb-8 relative overflow-hidden"
        >
          <div 
            className="absolute inset-0 opacity-5"
            style={{ background: `linear-gradient(135deg, ${memberColor}, transparent)` }}
          />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              {/* Avatar */}
              <div className="relative">
                <div 
                  className="w-32 h-32 rounded-2xl overflow-hidden border-4 flex items-center justify-center text-6xl"
                  style={{ borderColor: memberColor, background: 'var(--glass-bg)' }}
                >
                  {employee.avatar?.fileUrl ? (
                    <img src={employee.avatar.fileUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    '👤'
                  )}
                </div>
                <div 
                  className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center border-4"
                  style={{ 
                    backgroundColor: memberColor, 
                    borderColor: 'var(--bg-primary)' 
                  }}
                >
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="text-center md:text-left flex-1">
                <h2 
                  className="text-3xl font-bold mb-2"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                >
                  {fullName}
                </h2>
                <p className="text-lg mb-4" style={{ color: memberColor }}>
                  {roleLabel}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 justify-center md:justify-start" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Дата найма: {new Date(employee.hireDate).toLocaleDateString('ru')}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start" style={{ color: 'var(--text-secondary)' }}>
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">Ставка: {employee.hourlyRate?.toLocaleString('ru-RU') ?? '—'} ₽/ч</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start" style={{ color: 'var(--text-secondary)' }}>
                    <Award className="w-4 h-4" />
                    <span className="text-sm">Email: {employee.user?.email ?? employee.email ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start" style={{ color: 'var(--text-secondary)' }}>
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Посещений: {totalDays}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-heading)', color: memberColor }}
                >
                  {totalDays}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Дней в учёте
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--status-confirmed)' }}
                >
                  {Math.round(totalHours)}h
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Часов
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--status-confirmed)' }}
                >
                  {totalSalary.toLocaleString('ru-RU')} ₽
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  К выплате (по ставке)
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--orange-subtle)' }}
                >
                  {employeeAchievements.length}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Ачивок
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Данные сотрудника */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 card-shadow-lg mb-6"
        >
          <h3 
            className="text-xl font-bold mb-4 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            <Target className="w-5 h-5" style={{ color: memberColor }} />
            Данные сотрудника
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Отдел: {employee.department?.name ?? '—'} • Телефон: {employee.phone ?? '—'} • В команде: {monthsInTeam} мес.
          </p>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 card-shadow-lg"
        >
          <h3 
            className="text-xl font-bold mb-6 flex items-center gap-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            <Trophy className="w-5 h-5" style={{ color: memberColor }} />
            Достижения
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(employeeAchievements.length ? employeeAchievements.map((x) => ({
              id: x.id,
              title: x.achievement.title,
              description: x.achievement.description || '',
              icon: x.achievement.icon || '🏆',
              unlocked: true,
              date: x.earnedAt,
            })) : [] as Achievement[]).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className={`glass rounded-xl p-4 relative overflow-hidden ${
                  achievement.unlocked ? 'hover-red-glow' : 'opacity-50'
                }`}
              >
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{ background: achievement.unlocked ? memberColor : 'var(--text-tertiary)' }}
                />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    {achievement.unlocked && (
                      <CheckCircle2 className="w-5 h-5" style={{ color: memberColor }} />
                    )}
                  </div>
                  <h4 
                    className="font-bold text-sm mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {achievement.title}
                  </h4>
                  <p 
                    className="text-xs mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {achievement.description}
                  </p>
                  {achievement.unlocked && achievement.date && (
                    <p 
                      className="text-xs"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Получено: {new Date(achievement.date).toLocaleDateString('ru')}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        </>
        )}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/home')}
            className="glass rounded-xl px-8 py-3 font-medium hover-red-glow"
            style={{ color: 'var(--accent-primary)' }}
          >
            Вернуться к команде
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
