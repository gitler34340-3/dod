import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { BarChart3, Calendar, Wallet, Trophy, Users } from 'lucide-react';
import { apiFetch } from '@/app/api/api';
import { toast } from 'sonner';

interface PayrollItem {
  id: string;
  employee: { id: string; firstName: string; lastName: string };
  department?: { id: string; name: string };
  periodStart: string;
  periodEnd: string;
  total: number;
  status: string;
}

interface AttendanceRow {
  id: string;
  date: string;
  workHours?: number | null;
  status: string;
  employee: { id: string; firstName: string; lastName: string };
}

interface AchievementRow {
  id: string;
}

interface ShiftRow {
  id: string;
  status: string;
  employeeId?: string | null;
}

export function StatsScreen() {
  const { isHr, token, user } = useAuth();
  const isManager = user?.role === 'Manager';

  const [payrollDrafts, setPayrollDrafts] = useState<PayrollItem[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  useEffect(() => {
    if (!token || !(isHr || isManager)) return;

    const fetchStatsData = async () => {
      setLoadingPayroll(true);
      try {
        const [payroll, attendance, achievementsData, shiftsData] = await Promise.all([
          apiFetch<PayrollItem[]>('/payroll?status=draft', undefined, token).catch(() => []),
          apiFetch<AttendanceRow[]>('/attendance', undefined, token).catch(() => []),
          apiFetch<AchievementRow[]>('/achievements', undefined, token).catch(() => []),
          apiFetch<ShiftRow[]>('/shifts', undefined, token).catch(() => []),
        ]);
        setPayrollDrafts(payroll || []);
        setAttendanceRows(attendance || []);
        setAchievements(achievementsData || []);
        setShifts(shiftsData || []);
      } catch (err: any) {
        toast.error(err?.message || 'Ошибка при загрузке статистики');
      } finally {
        setLoadingPayroll(false);
      }
    };

    fetchStatsData();
  }, [token, isHr, isManager]);

  const summary = useMemo(() => {
    const totalPayroll = payrollDrafts.reduce((sum, item) => sum + item.total, 0);
    const totalHours = attendanceRows.reduce((sum, row) => sum + Number(row.workHours || 0), 0);
    const pendingShifts = shifts.filter((shift) => String(shift.status).toLowerCase() === 'pending').length;
    const uniqueEmployees = new Set(attendanceRows.map((row) => row.employee.id)).size;

    return {
      totalPayroll,
      totalHours,
      pendingShifts,
      uniqueEmployees,
    };
  }, [attendanceRows, payrollDrafts, shifts]);

  if (!isHr && !isManager) {
    return (
      <div className="rounded-xl p-8 text-center border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Доступ только для HR и менеджеров.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
        <BarChart3 className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
        Статистика
      </h1>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-xl p-5 border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-2 mb-2"><Wallet className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />Черновики зарплаты</div>
          <div className="text-2xl font-bold">{payrollDrafts.length}</div>
        </div>
        <div className="rounded-xl p-5 border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-2 mb-2"><Calendar className="w-5 h-5" style={{ color: 'var(--status-confirmed)' }} />Часы посещаемости</div>
          <div className="text-2xl font-bold">{summary.totalHours.toFixed(1)}</div>
        </div>
        <div className="rounded-xl p-5 border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5" style={{ color: 'var(--status-pending)' }} />Сотрудники в отчётах</div>
          <div className="text-2xl font-bold">{summary.uniqueEmployees}</div>
        </div>
        <div className="rounded-xl p-5 border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-2 mb-2"><Trophy className="w-5 h-5" style={{ color: 'var(--orange-subtle)' }} />Достижения</div>
          <div className="text-2xl font-bold">{achievements.length}</div>
        </div>
      </div>

      <div className="rounded-xl p-8 border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
        <h2 className="text-xl font-semibold mb-3">Сводка</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>Сумма черновиков зарплаты: <strong>{summary.totalPayroll.toLocaleString('ru-RU')} ₽</strong></div>
          <div>Смен на рассмотрении: <strong>{summary.pendingShifts}</strong></div>
          <div>Записей посещаемости: <strong>{attendanceRows.length}</strong></div>
        </div>
      </div>

      <div className="rounded-xl p-8 border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
        <h2 className="text-xl font-semibold mb-3">Черновики расчетов зарплаты</h2>
        {loadingPayroll ? (
          <p style={{ color: 'var(--text-secondary)' }}>Загрузка...</p>
        ) : payrollDrafts.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Нет черновиков</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--text-secondary)' }}>
                  <th className="text-left p-2">Сотрудник</th>
                  <th className="text-left p-2">Период</th>
                  <th className="text-left p-2">Сумма</th>
                  <th className="text-left p-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {payrollDrafts.map((item) => (
                  <tr key={item.id} className="border-t" style={{ borderColor: 'var(--glass-border)' }}>
                    <td className="p-2">{item.employee.firstName} {item.employee.lastName}</td>
                    <td className="p-2">{new Date(item.periodStart).toLocaleDateString('ru-RU')} - {new Date(item.periodEnd).toLocaleDateString('ru-RU')}</td>
                    <td className="p-2">{item.total.toLocaleString('ru-RU')}</td>
                    <td className="p-2">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl p-8 border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
        <h2 className="text-xl font-semibold mb-3">Последняя посещаемость</h2>
        {attendanceRows.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Нет данных по посещаемости</p>
        ) : (
          <div className="space-y-3">
            {attendanceRows.slice(0, 5).map((row) => (
              <div key={row.id} className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--glass-border)' }}>
                <div>
                  <div>{row.employee.firstName} {row.employee.lastName}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{new Date(row.date).toLocaleDateString('ru-RU')}</div>
                </div>
                <div className="text-right">
                  <div>{Number(row.workHours || 0).toFixed(1)} ч.</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{row.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
