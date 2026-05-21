import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useTheme } from '@/app/contexts/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type KPIChartProps = {
  labels?: string[];
  completedTasks?: number[];
  kpiScores?: number[];
};

export function KPIChart({
  labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  completedTasks = [8, 12, 10, 15, 13, 18, 16],
  kpiScores = [85, 92, 88, 95, 90, 98, 94],
}: KPIChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = {
    labels,
    datasets: [
      {
        label: 'Задачи выполнены',
        data: completedTasks,
        backgroundColor: isDark ? 'rgba(193, 18, 31, 0.8)' : 'rgba(160, 16, 16, 0.8)',
        borderColor: isDark ? '#c1121f' : '#a01010',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'KPI балл',
        data: kpiScores,
        backgroundColor: isDark ? 'rgba(156, 82, 0, 0.6)' : 'rgba(122, 62, 0, 0.6)',
        borderColor: isDark ? '#9c5200' : '#7a3e00',
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#d7ccc8' : '#5d4037',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 15, 15, 0.95)' : 'rgba(245, 230, 211, 0.95)',
        titleColor: isDark ? '#ffffff' : '#2c1810',
        bodyColor: isDark ? '#d7ccc8' : '#5d4037',
        borderColor: isDark ? '#c1121f' : '#a01010',
        borderWidth: 1,
        padding: 12,
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
        },
        ticks: {
          color: isDark ? '#d7ccc8' : '#5d4037',
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-full w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
