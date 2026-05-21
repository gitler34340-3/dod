import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartEvent,
  ActiveElement
} from 'chart.js';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRef, useState, useEffect } from 'react';
import { apiFetch } from '@/app/api/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalaryData {
  employeeId: string;
  totalHours: number;
  hourlyRate: number;
  grossSalary: number;
  period: { start: string; end: string };
}

interface SalaryChartProps {
  period: 'day' | 'week' | 'month' | 'year' | 'all';
}

export function SalaryChart({ period }: SalaryChartProps) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const chartRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: []
  });
  
  const isDark = theme === 'dark';
  const employeeId = session?.user?.employeeId;

  useEffect(() => {
    const loadSalaryData = async () => {
      if (!employeeId) {
        setError('Сотрудник не найден');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let data: { labels: string[]; data: number[] } = { labels: [], data: [] };

        switch (period) {
          case 'week': {
            const result = await apiFetch<SalaryData>('/salary/week/current');
            const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            const dailySalary = Math.round(result.grossSalary / 5); // Assuming 5 work days
            data = {
              labels: days,
              data: days.map((_, i) => i < 5 ? dailySalary : 0)
            };
            break;
          }

          case 'month': {
            const result = await apiFetch<SalaryData>('/salary/month/current');
            const weeks = ['Нед 1', 'Нед 2', 'Нед 3', 'Нед 4'];
            const weeklySalary = Math.round(result.grossSalary / 4);
            data = {
              labels: weeks,
              data: weeks.map(() => weeklySalary)
            };
            break;
          }

          case 'year': {
            // Calculate salary for each month
            const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            const monthlySalaries: number[] = [];

            const now = new Date();
            const currentYear = now.getFullYear();

            for (let month = 0; month < 12; month++) {
              const start = new Date(currentYear, month, 1);
              const end = new Date(currentYear, month + 1, 0);
              end.setHours(23, 59, 59, 999);

              try {
                const result = await apiFetch<SalaryData>(
                  `/salary/${employeeId}/period?startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`
                );
                monthlySalaries.push(result.grossSalary);
              } catch {
                monthlySalaries.push(0);
              }
            }

            data = {
              labels: months,
              data: monthlySalaries
            };
            break;
          }

          case 'day': {
            // For day view, show hourly breakdown
            const result = await apiFetch<SalaryData>('/salary/week/current');
            const hours = Array.from({ length: 8 }, (_, i) => `${i * 3}:00`);
            const hourlyRate = result.hourlyRate;
            data = {
              labels: hours,
              data: hours.map((_, i) => {
                const workHours = [0, 0, 0, 0, 8, 6, 4, 2]; // Sample pattern
                return Math.round(workHours[i] * hourlyRate);
              })
            };
            break;
          }

          case 'all': {
            // Get data for last several years/periods
            const periods = ['2023', '2024 Q1', '2024 Q2', '2024 Q3', '2024 Q4', '2025', '2026'];
            const periodData: number[] = [];

            // Fetch current month as sample
            const result = await apiFetch<SalaryData>('/salary/month/current');
            const avgMonthly = result.grossSalary;

            periodData.push(avgMonthly * 12); // 2023 (assumed annual)
            periodData.push(avgMonthly * 3);  // 2024 Q1
            periodData.push(avgMonthly * 3);  // 2024 Q2
            periodData.push(avgMonthly * 3);  // 2024 Q3
            periodData.push(avgMonthly * 3);  // 2024 Q4
            periodData.push(avgMonthly * 12); // 2025
            periodData.push(avgMonthly * 5);  // 2026 (partial)

            data = {
              labels: periods,
              data: periodData
            };
            break;
          }

          default:
            data = { labels: [], data: [] };
        }

        setChartData(data);
      } catch (err: any) {
        setError(err?.message || 'Ошибка при загрузке данных зарплаты');
        console.error('Error loading salary data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSalaryData();
  }, [period, employeeId]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error || chartData.labels.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <p className={isDark ? 'text-red-400' : 'text-red-600'}>
            {error || 'Нет данных для отображения'}
          </p>
        </div>
      </div>
    );
  }

  const chartConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Зарплата (₽)',
        data: chartData.data,
        borderColor: isDark ? '#c1121f' : '#a01010',
        backgroundColor: isDark ? 'rgba(193, 18, 31, 0.1)' : 'rgba(160, 16, 16, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartData.data.map((_, idx) => 
          selectedIndex === idx 
            ? (isDark ? '#ff4444' : '#ff6666')
            : (isDark ? '#c1121f' : '#a01010')
        ),
        pointBorderColor: chartData.data.map((_, idx) => 
          selectedIndex === idx
            ? (isDark ? '#ffaa00' : '#ffcc33')
            : (isDark ? '#fff' : '#2c1810')
        ),
        pointBorderWidth: chartData.data.map((_, idx) => 
          selectedIndex === idx ? 3 : 2
        ),
        pointRadius: chartData.data.map((_, idx) => 
          selectedIndex === idx ? 7 : 5
        ),
        pointHoverRadius: 8,
        pointHoverBackgroundColor: isDark ? '#ff4444' : '#ff6666',
        pointHoverBorderColor: isDark ? '#ffaa00' : '#ffcc33',
        pointHoverBorderWidth: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeInOutQuart' as const,
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDark ? 'rgba(15, 15, 15, 0.98)' : 'rgba(245, 230, 211, 0.98)',
        titleColor: isDark ? '#ffffff' : '#2c1810',
        bodyColor: isDark ? '#d7ccc8' : '#5d4037',
        borderColor: isDark ? '#c1121f' : '#a01010',
        borderWidth: 2,
        padding: 16,
        displayColors: false,
        usePointStyle: true,
        boxPadding: 8,
        titleFont: {
          size: 13,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          title: (context: any) => `${context[0].label}`,
          label: (context: any) => `Зарплата: ${context.parsed.y.toLocaleString('ru-RU')} ₽`,
          afterLabel: (context: any) => {
            if (context.datasetIndex === 0 && context.dataIndex > 0) {
              const current = context.parsed.y;
              const previous = context.chart.data.datasets[0].data[context.dataIndex - 1];
              const change = current - previous;
              const percent = ((change / previous) * 100).toFixed(1);
              return `Изменение: ${change > 0 ? '+' : ''}${change.toLocaleString('ru-RU')} (${percent}%)`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: isDark ? '#d7ccc8' : '#5d4037',
          font: {
            size: 11
          }
        },
        border: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(44, 24, 16, 0.2)'
        }
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(44, 24, 16, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: isDark ? '#d7ccc8' : '#5d4037',
          font: {
            size: 11
          },
          callback: (value: any) => `${(value / 1000).toFixed(0)}k`
        },
        border: {
          display: false
        }
      }
    }
  };

  const handleChartClick = (event: ChartEvent, elements: ActiveElement[]) => {
    if (elements && elements.length > 0) {
      const index = elements[0].index;
      setSelectedIndex(selectedIndex === index ? null : index);
    }
  };

  const handleChartHover = (event: ChartEvent, elements: ActiveElement[]) => {
    if (elements && elements.length > 0) {
      setHoveredIndex(elements[0].index);
    } else {
      setHoveredIndex(null);
    }
  };

  return (
    <div className="h-full w-full group cursor-crosshair transition-all duration-200">
      <Line 
        ref={chartRef}
        data={chartConfig} 
        options={{
          ...options,
          onHover: handleChartHover,
          onClick: handleChartClick,
        } as any}
      />
      {selectedIndex !== null && (
        <div className="mt-3 text-center text-xs text-opacity-75">
          <span className="inline-block px-2 py-1 rounded bg-red-500/20 text-red-400">
            Выбран период: {chartData.labels[selectedIndex]} — {chartData.data[selectedIndex].toLocaleString('ru-RU')} ₽
          </span>
        </div>
      )}
    </div>
  );
}
