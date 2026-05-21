import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Users, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { format, startOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PreferenceApplicant {
  id: string;
  workerId: string;
  workerName: string;
  status: 'pending' | 'approved' | 'rejected';
  totalHours: number;
  overtimeWarning?: string;
  employeeKpi?: {
    totalHoursThisMonth: number;
    absenceRate: number;
    performanceScore: number;
  };
}

interface ShiftGap {
  day: number;
  shift: string;
  required: number;
  available: number;
  gap: number;
}

interface WeeklyOverview {
  day_0?: Record<string, PreferenceApplicant[]>;
  day_1?: Record<string, PreferenceApplicant[]>;
  day_2?: Record<string, PreferenceApplicant[]>;
  day_3?: Record<string, PreferenceApplicant[]>;
  day_4?: Record<string, PreferenceApplicant[]>;
  day_5?: Record<string, PreferenceApplicant[]>;
  day_6?: Record<string, PreferenceApplicant[]>;
}

export function AdminScheduleManagement() {
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [overview, setOverview] = useState<WeeklyOverview | null>(null);
  const [gaps, setGaps] = useState<ShiftGap[]>([]);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishingSchedule, setPublishingSchedule] = useState(false);

  useEffect(() => {
    fetchScheduleData();
  }, [weekStart]);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Получить обзор пожеланий
      const overviewRes = await fetch(
        `/api/shift-preferences-management/week-overview?weekStart=${weekStartStr}&departmentId=all`,
      );
      const overviewData = await overviewRes.json();
      setOverview(overviewData.overview);

      // Получить информацию о дырах в графике
      const gapsRes = await fetch(
        `/api/shift-preferences-management/gaps?weekStart=${weekStartStr}&departmentId=all`,
        { method: 'POST' },
      );
      const gapsData = await gapsRes.json();
      setGaps(gapsData.gaps);
    } catch (error) {
      console.error('Ошибка при загрузке графика:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplicant = async (preferenceId: string) => {
    try {
      await fetch(`/api/shift-preferences-management/${preferenceId}/approve`, { method: 'PATCH' });
      await fetchScheduleData();
    } catch (error) {
      console.error('Ошибка при одобрении:', error);
    }
  };

  const handleRejectApplicant = async (preferenceId: string) => {
    try {
      await fetch(`/api/shift-preferences-management/${preferenceId}/reject`, { method: 'PATCH' });
      await fetchScheduleData();
    } catch (error) {
      console.error('Ошибка при отклонении:', error);
    }
  };

  const handlePublishSchedule = async () => {
    setPublishingSchedule(true);
    try {
      // Отправить все одобренные пожелания в графики
      const response = await fetch('/api/shifts/publish-from-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart: format(weekStart, 'yyyy-MM-dd') }),
      });

      if (response.ok) {
        alert('✓ График опубликован! Всем рабочим отправлены уведомления.');
        await fetchScheduleData();
      }
    } catch (error) {
      console.error('Ошибка при публикации:', error);
    } finally {
      setPublishingSchedule(false);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const shiftNames: Record<string, string> = {
    morning: '🌅 Утро',
    day: '☀️ День',
    evening: '🌙 Вечер',
    night: '⭐ Ночь',
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и контроли */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            Управление графиком
          </h2>
          <p className="text-gray-600 mt-1">
            Неделя с {format(weekStart, 'd MMMM', { locale: ru })} по{' '}
            {format(addDays(weekStart, 6), 'd MMMM', { locale: ru })}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            disabled={loading}
          >
            ← Пред. неделя
          </Button>
          <Button
            variant="outline"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            disabled={loading}
          >
            След. неделя →
          </Button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePublishSchedule}
            disabled={publishingSchedule || gaps.length > 0}
            className="px-6 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {publishingSchedule ? '⏳ Публикуем...' : '📢 Опубликовать график'}
          </motion.button>
        </div>
      </div>

      {/* Предупреждения о дырах в графике */}
      <AnimatePresence>
        {gaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-lg bg-red-50 border border-red-200"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">⚠️ Дырки в графике ({gaps.length})</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {gaps.map((gap, idx) => (
                    <div key={idx} className="text-sm text-red-800">
                      • {dayNames[gap.day]} {shiftNames[gap.shift]}: нужно {gap.gap} чел. (доступно {gap.available})
                    </div>
                  ))}
                </div>
                <p className="text-sm text-red-700 mt-2">
                  💡 Рекомендация: Принудительно назначьте рабочих на недостающие смены
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Таблица пожеланий по дням и сменам */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
        {weekDays.map((day, dayIdx) => (
          <motion.div
            key={day.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIdx * 0.05 }}
          >
            <Card className="glass rounded-xl border-0 overflow-hidden h-full">
              <CardHeader className="p-3 pb-2">
                <p className="font-bold text-center">{dayNames[dayIdx]}</p>
                <p className="text-xs text-gray-600 text-center">{format(day, 'd MMM')}</p>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {Object.entries(overview?.[`day_${dayIdx}`] || {}).map(([shiftType, applicants]) => (
                  <motion.button
                    key={shiftType}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedShift(`${dayIdx}-${shiftType}`)}
                    className={`w-full p-2 rounded-lg text-xs text-white font-semibold transition-all ${
                      selectedShift === `${dayIdx}-${shiftType}` ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{
                      backgroundColor:
                        shiftType === 'morning'
                          ? '#FFB84D'
                          : shiftType === 'day'
                            ? '#4DB8FF'
                            : shiftType === 'evening'
                              ? '#9D4DFF'
                              : '#FF6B6B',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{shiftNames[shiftType]}</span>
                      <Badge variant="secondary" className="text-xs">
                        {applicants.length}
                      </Badge>
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Детальная таблица выбранной смены */}
      {selectedShift && overview && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <Card className="glass rounded-2xl border-0 card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Кандидаты на смену ({dayNames[parseInt(selectedShift.split('-')[0])]} -{' '}
                {shiftNames[selectedShift.split('-')[1]]})
              </CardTitle>
              <CardDescription>Выберите лучших кандидатов для этой смены</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Сотрудник</TableHead>
                      <TableHead>Часов</TableHead>
                      <TableHead className="text-right">KPI этого месяца</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      overview[
                        `day_${selectedShift.split('-')[0]}` as keyof WeeklyOverview
                      ]?.[selectedShift.split('-')[1]] || []
                    ).map((applicant: PreferenceApplicant) => (
                      <motion.tr
                        key={applicant.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`${
                          applicant.overtimeWarning ? 'bg-yellow-50' : ''
                        } hover:bg-gray-50 transition-colors`}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <p>{applicant.workerName}</p>
                            {applicant.overtimeWarning && (
                              <p className="text-xs text-yellow-700 mt-1">
                                {applicant.overtimeWarning}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={applicant.totalHours > 40 ? 'destructive' : 'default'}>
                            {applicant.totalHours}ч
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3" />
                              {applicant.employeeKpi?.totalHoursThisMonth}ч
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {applicant.employeeKpi?.performanceScore}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleApproveApplicant(applicant.id)}
                              className="p-2 rounded-lg hover:bg-green-100 text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRejectApplicant(applicant.id)}
                              className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                            >
                              <XCircle className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {loading && (
        <div className="text-center py-8">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
            <Clock className="w-8 h-8 mx-auto opacity-50" />
          </motion.div>
          <p className="text-gray-600 mt-2">Загрузка данных...</p>
        </div>
      )}
    </div>
  );
}
