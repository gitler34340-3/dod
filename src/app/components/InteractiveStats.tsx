import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';
import { ShiftsDistributionChart } from '@/app/components/charts/ShiftsDistributionChart';
import { KPIChart } from '@/app/components/charts/KPIChart';

interface Stat {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  hasChart?: boolean;
  chartType?: 'shifts' | 'kpi';
}

type ChartData = {
  labels: string[];
  values: number[];
};

type KPIData = {
  labels: string[];
  completedTasks: number[];
  kpiScores: number[];
};

type InteractiveStatsProps = {
  stats: Stat[];
  shiftsChartData?: ChartData;
  kpiChartData?: KPIData;
};

export function InteractiveStats({
  stats,
  shiftsChartData,
  kpiChartData,
}: InteractiveStatsProps) {
  const [selectedStat, setSelectedStat] = useState<Stat | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedStat(stat)}
            className="glass rounded-2xl p-4 card-shadow cursor-pointer hover-red-glow relative overflow-hidden"
          >
            {stat.hasChart && (
              <div 
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: stat.color }}
              />
            )}
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: stat.color, color: '#ffffff' }}
            >
              {stat.icon}
            </div>
            <div 
              className="text-3xl font-bold mb-1"
              style={{ color: stat.color, fontFamily: 'var(--font-heading)' }}
            >
              {stat.value}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedStat} onOpenChange={() => setSelectedStat(null)}>
        <DialogContent 
          className="glass rounded-3xl border-0 card-shadow-lg max-w-2xl"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <AnimatePresence mode="wait">
            {selectedStat && (
              <motion.div
                key={selectedStat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: selectedStat.color }}
                    >
                      <div className="scale-150 text-white">
                        {selectedStat.icon}
                      </div>
                    </div>
                    <div>
                      <h3 
                        className="text-2xl font-bold"
                        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                      >
                        {selectedStat.label}
                      </h3>
                      <p 
                        className="text-4xl font-bold"
                        style={{ color: selectedStat.color, fontFamily: 'var(--font-heading)' }}
                      >
                        {selectedStat.value}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedStat(null)}
                    className="p-2 rounded-full glass hover-red-glow"
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  </motion.button>
                </div>

                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {selectedStat.description}
                </p>

                {selectedStat.hasChart && (
                  <div className="glass rounded-2xl p-6">
                    <div className="h-80">
                      {selectedStat.chartType === 'shifts' && (
                        <ShiftsDistributionChart
                          labels={shiftsChartData?.labels}
                          values={shiftsChartData?.values}
                        />
                      )}
                      {selectedStat.chartType === 'kpi' && (
                        <KPIChart
                          labels={kpiChartData?.labels}
                          completedTasks={kpiChartData?.completedTasks}
                          kpiScores={kpiChartData?.kpiScores}
                        />
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
