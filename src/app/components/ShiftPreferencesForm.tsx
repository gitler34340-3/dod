import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Calendar, Clock, AlertCircle, CheckCircle, Send, X } from 'lucide-react';
import { format, addDays, startOfWeek, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TimeSlot {
  dayOfWeek: number;
  shiftType: 'morning' | 'day' | 'evening' | 'night' | 'flexible';
  estimatedHours?: number;
  startHour?: number;
  endHour?: number;
}

interface DeadlineInfo {
  weekStartDate: string;
  deadline: string;
  isOpen: boolean;
  daysUntilDeadline: number;
}

const SHIFT_TYPES = [
  { id: 'morning', label: 'Утро (06:00-14:00)', hours: 8, color: '#FFB84D' },
  { id: 'day', label: 'День (14:00-22:00)', hours: 8, color: '#4DB8FF' },
  { id: 'evening', label: 'Вечер (22:00-06:00)', hours: 8, color: '#9D4DFF' },
  { id: 'night', label: 'Ночь (неопределено)', hours: 8, color: '#FF6B6B' },
  { id: 'flexible', label: 'Гибкий график', hours: 0, color: '#51CF66' },
];

export function ShiftPreferencesForm() {
  const [deadline, setDeadline] = useState<DeadlineInfo | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [comment, setComment] = useState('');
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    // Получить информацию о дедлайне
    fetchDeadline();
    generateWeekDays();
  }, []);

  const fetchDeadline = async () => {
    try {
      const response = await fetch('/api/shift-preferences-management/deadline');
      const data = await response.json();
      setDeadline(data);
    } catch (error) {
      console.error('Ошибка при получении дедлайна:', error);
    }
  };

  const generateWeekDays = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Начинается с понедельника
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    setWeekDays(days);
  };

  const toggleSlot = (dayOfWeek: number, shiftType: string) => {
    const shiftInfo = SHIFT_TYPES.find(s => s.id === shiftType);
    const newSlot: TimeSlot = {
      dayOfWeek,
      shiftType: shiftType as any,
      estimatedHours: shiftInfo?.hours,
    };

    setSelectedSlots(prev => {
      const exists = prev.some(s => s.dayOfWeek === dayOfWeek && s.shiftType === shiftType);
      if (exists) {
        return prev.filter(s => !(s.dayOfWeek === dayOfWeek && s.shiftType === shiftType));
      }
      return [...prev, newSlot];
    });
  };

  const getTotalHours = () => {
    return selectedSlots.reduce((sum, slot) => sum + (slot.estimatedHours || 0), 0);
  };

  const handleSubmit = async () => {
    if (!deadline || selectedSlots.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/shift-preferences-management/submit-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSlots: selectedSlots,
          weekStartDate: deadline.weekStartDate,
          comment: comment || undefined,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setSelectedSlots([]);
          setComment('');
        }, 3000);
      }
    } catch (error) {
      console.error('Ошибка при подаче пожеланий:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalHours = getTotalHours();
  const isOvertime = totalHours > 60;
  const isDeadlinePassed = deadline && !deadline.isOpen;

  return (
    <div className="space-y-6">
      {/* Информация о дедлайне */}
      {deadline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-start gap-3 ${
            isDeadlinePassed
              ? 'bg-red-100 border border-red-300'
              : deadline.daysUntilDeadline <= 1
                ? 'bg-yellow-100 border border-yellow-300'
                : 'bg-blue-100 border border-blue-300'
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isDeadlinePassed
                ? 'text-red-600'
                : deadline.daysUntilDeadline <= 1
                  ? 'text-yellow-600'
                  : 'text-blue-600'
            }`}
          />
          <div className="flex-1">
            <p className="font-semibold">
              {isDeadlinePassed
                ? '❌ Подача пожеланий закрыта'
                : `📅 Дедлайн: ${format(new Date(deadline.deadline), 'EEEE, d MMMM в HH:mm', {
                    locale: ru,
                  })}`}
            </p>
            <p className="text-sm opacity-80">
              {isDeadlinePassed
                ? `Пожелания на неделю ${deadline.weekStartDate} больше не принимаются`
                : `Осталось ${deadline.daysUntilDeadline} дней`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Календарь выбора */}
      {!isDeadlinePassed && deadline && (
        <Card className="glass rounded-2xl border-0 card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Выберите удобные смены на неделю
            </CardTitle>
            <CardDescription>
              Неделя с {format(new Date(deadline.weekStartDate), 'd MMMM', { locale: ru })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Дни недели */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day, dayIndex) => (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dayIndex * 0.05 }}
                  className="space-y-3"
                >
                  <div className="text-center font-semibold text-sm p-2 rounded-lg bg-gray-100">
                    <div>{format(day, 'EEE', { locale: ru })}</div>
                    <div className="text-xs opacity-60">{format(day, 'd MMM')}</div>
                  </div>

                  {/* Смены для этого дня */}
                  <div className="space-y-2">
                    {SHIFT_TYPES.map(shift => {
                      const isSelected = selectedSlots.some(
                        s => s.dayOfWeek === dayIndex && s.shiftType === shift.id,
                      );
                      return (
                        <motion.button
                          key={`${dayIndex}-${shift.id}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleSlot(dayIndex, shift.id)}
                          className={`w-full p-2 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? 'ring-2 ring-offset-2 text-white'
                              : 'opacity-50 hover:opacity-75 text-gray-700'
                          }`}
                          style={{
                            backgroundColor: isSelected ? shift.color : '#f0f0f0',
                            ringColor: shift.color,
                          }}
                        >
                          {isSelected ? '✓' : ''} {shift.hours}ч
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Итоги */}
            <motion.div className="p-4 rounded-lg bg-gray-50 space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Всего часов:</span>
                <motion.span
                  key={totalHours}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`text-lg font-bold ${isOvertime ? 'text-red-600' : 'text-green-600'}`}
                >
                  {totalHours}ч
                </motion.span>
              </div>

              {isOvertime && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  ⚠️ Превышено максимум (60ч/неделю)
                </motion.div>
              )}

              <div className="flex items-center gap-2 text-sm opacity-60">
                <Clock className="w-4 h-4" />
                Выбрано: {selectedSlots.length} смен
              </div>
            </motion.div>

            {/* Комментарий */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Дополнительный комментарий (опционально)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Например, предпочитаю работать без ночных смен..."
                className="w-full p-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Кнопка отправки */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting || selectedSlots.length === 0 || isOvertime}
              className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: selectedSlots.length > 0 && !isOvertime ? '#51CF66' : '#ccc',
              }}
            >
              {isSubmitting ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Clock className="w-5 h-5" />
                  </motion.div>
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Отправить пожелания
                </>
              )}
            </motion.button>
          </CardContent>
        </Card>
      )}

      {/* Сообщение об успехе */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-lg bg-green-100 border border-green-300 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">✓ Пожелания отправлены!</p>
              <p className="text-sm text-green-700">Админ рассмотрит вашу заявку до дедлайна</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Заблокирован после дедлайна */}
      {isDeadlinePassed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 rounded-lg text-center text-gray-500"
        >
          <X className="w-12 h-12 mx-auto opacity-30 mb-3" />
          <p>Подача пожеланий на эту неделю закрыта.</p>
          <p className="text-sm mt-2">Следующее открытие будет на следующей неделе в пятницу в 18:00</p>
        </motion.div>
      )}
    </div>
  );
}
