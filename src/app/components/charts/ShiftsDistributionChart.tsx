import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTheme } from '@/app/contexts/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

type ShiftsDistributionChartProps = {
  labels?: string[];
  values?: number[];
};

export function ShiftsDistributionChart({
  labels = ['Утренние', 'Дневные', 'Вечерние', 'Ночные'],
  values = [8, 12, 15, 5],
}: ShiftsDistributionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          isDark ? 'rgba(193, 18, 31, 0.8)' : 'rgba(160, 16, 16, 0.8)',
          isDark ? 'rgba(157, 2, 8, 0.8)' : 'rgba(139, 0, 0, 0.8)',
          isDark ? 'rgba(156, 82, 0, 0.8)' : 'rgba(122, 62, 0, 0.8)',
          isDark ? 'rgba(106, 4, 15, 0.8)' : 'rgba(106, 4, 15, 0.8)',
        ],
        borderColor: [
          isDark ? '#c1121f' : '#a01010',
          isDark ? '#9d0208' : '#8b0000',
          isDark ? '#9c5200' : '#7a3e00',
          isDark ? '#6a040f' : '#6a040f',
        ],
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
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
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed} смен`
        }
      }
    }
  };

  return (
    <div className="h-full w-full">
      <Doughnut data={data} options={options} />
    </div>
  );
}
