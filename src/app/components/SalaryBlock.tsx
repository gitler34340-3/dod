import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { SalaryChart } from '@/app/components/charts/SalaryChart';
import { useAuth } from '@/app/contexts/AuthContext';
import { apiFetch } from '@/app/api/api';

type Period = 'week' | 'month';

interface PeriodButton {
  key: Period;
  label: string;
}

interface SalaryData {
  employeeId: string;
  totalHours: number;
  hourlyRate: number;
  grossSalary: number;
  period: { start: string; end: string };
}

const periods: PeriodButton[] = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
];

export function SalaryBlock() {
  const { token } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalary = async () => {
      if (!token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = selectedPeriod === 'week' 
          ? '/salary/week/current'
          : '/salary/month/current';
        
        const data = await apiFetch<SalaryData>(endpoint, undefined, token);
        setSalaryData(data);
      } catch (err) {
        console.error('Failed to fetch salary:', err);
        setError('Не удалось загрузить данные о зарплате');
      } finally {
        setLoading(false);
      }
    };

    fetchSalary();
  }, [selectedPeriod, token]);

  const amount = salaryData?.grossSalary ?? 0;
  const totalHours = salaryData?.totalHours ?? 0;
  const hourlyRate = salaryData?.hourlyRate ?? 0;
  
  // Dynamic change vs previously loaded value for this period (client-side)
  const key = `salary_prev_${selectedPeriod}`;
  const prevRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  const prevAmount = prevRaw ? Number(prevRaw) : null;
  const change =
    prevAmount && prevAmount > 0
      ? Math.round(((amount - prevAmount) / prevAmount) * 1000) / 10
      : 0;

  useEffect(() => {
    if (!salaryData) return;
    localStorage.setItem(key, String(amount));
  }, [amount, key, salaryData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass rounded-3xl p-6 card-shadow-lg hover-red-glow relative overflow-hidden"
    >
      {/* Wanted Poster Style Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)`,
        color: 'var(--accent-primary)'
      }} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-primary)' }}
            >
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
              >
                Зарплата
              </h3>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-3 h-3" />
                <span className="text-xs">
                  {periods.find(p => p.key === selectedPeriod)?.label}
                </span>
              </div>
            </div>
          </div>
          
          {/* Trend Indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="flex items-center gap-1 px-3 py-1 rounded-full"
            style={{ 
              backgroundColor: change > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
              color: change > 0 ? '#4caf50' : '#f44336'
            }}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-bold">{change >= 0 ? '+' : ''}{change}%</span>
          </motion.div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#f44336' }} />
            <span style={{ color: '#f44336', fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        {/* Amount */}
        <motion.div
          key={amount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div 
            className="text-5xl md:text-6xl font-bold mb-2"
            style={{ 
              fontFamily: 'var(--font-heading)',
              color: 'var(--accent-primary)',
              textShadow: '0 0 20px rgba(193, 18, 31, 0.3)'
            }}
          >
            {loading ? '...' : amount.toLocaleString('ru-RU')} ₽
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            За {selectedPeriod === 'week' ? 'неделю' : 'месяц'} ({totalHours.toFixed(1)} ч. × {hourlyRate} ₽/ч)
          </p>
        </motion.div>

        {/* Period Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {periods.map((period) => (
            <motion.button
              key={period.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPeriod(period.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: selectedPeriod === period.key 
                  ? 'var(--accent-primary)' 
                  : 'var(--glass-bg)',
                color: selectedPeriod === period.key 
                  ? '#ffffff' 
                  : 'var(--text-secondary)',
                border: `1px solid ${selectedPeriod === period.key ? 'transparent' : 'var(--glass-border)'}`,
              }}
            >
              {period.label}
            </motion.button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-64 rounded-xl p-4 glass">
          <SalaryChart period={selectedPeriod} />
        </div>
      </div>
    </motion.div>
  );
}
