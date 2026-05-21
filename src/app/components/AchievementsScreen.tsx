import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { apiFetch } from '@/app/api/api';


export function AchievementsScreen() {
  const navigate = useNavigate();

  // track popup/toast behaviour when a new achievement is added
  const prevCountRef = useRef<number>(0);

  interface EmployeeAchievement {
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
  }

  interface AchievementType {
    id: string;
    title: string;
    description: string;
    icon?: string | null;
    points: number;
  }

  const [achievements, setAchievements] = useState<EmployeeAchievement[]>([]);
  const [types, setTypes] = useState<AchievementType[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, token } = useAuth();

  useEffect(() => {
    if (!token || !user) return;
    setLoading(true);

    // load all achievement types for progress stat
    apiFetch<AchievementType[]>('/achievements', undefined, token)
      .then(setTypes)
      .catch(() => setTypes([]));

    const empId = user.employeeId;
    if (empId) {
      apiFetch<EmployeeAchievement[]>(`/achievements/by-employee/${empId}`, undefined, token)
        .then((ach) => {
          setAchievements(ach);
          if (ach.length > prevCountRef.current) {
            toast.success('Новое достижение получено!');
          }
          prevCountRef.current = ach.length;
        })
        .finally(() => setLoading(false));
    } else {
      // no linked employee yet
      setAchievements([]);
      setLoading(false);
    }
  }, [token, user]);

  const unlockedCount = achievements.length;
  const totalCount = types.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;


  // show toast when count increases
  useEffect(() => {
    if (achievements.length > prevCountRef.current) {
      toast.success('Новое достижение получено!');
    }
    prevCountRef.current = achievements.length;
  }, [achievements]);

  return (
    <div className="min-h-screen w-full dust-effect relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] via-[#2c1810] to-[#1a1a1a]">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 glass border-b border-white/10"
      >
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/home')}
            className="p-2 rounded-full glass"
          >
            <ArrowLeft className="w-6 h-6 text-[#ff6f00]" />
          </motion.button>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Достижения
          </h1>
        </div>
      </motion.header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6 glass rounded-2xl p-6 card-shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#d32f2f] to-[#ff6f00] bg-clip-text text-transparent">
                {unlockedCount} / {totalCount}
              </h2>
              <p className="text-[#d7ccc8]">Ачивок разблокировано</p>
            </div>
            <div className="text-5xl">🏆</div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-full bg-gradient-to-r from-[#d32f2f] to-[#ff6f00]"
            />
          </div>
          <p className="text-sm text-[#d7ccc8] mt-2 text-center">{completionPercentage}% завершено</p>
        </motion.div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="glass rounded-xl p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
            Загрузка достижений...
          </div>
        ) : achievements.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
            Пока нет заработанных достижений. Начните работать, чтобы получить первые ачивки!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((entry, index) => {
              const ach = entry.achievement;
              const icon = ach.icon || '🏆';
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                  whileHover={{ scale: 1.03 }}
                  className="glass rounded-2xl p-5 card-shadow-lg cursor-pointer relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d32f2f] to-[#ff6f00] flex items-center justify-center text-3xl">
                        {icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                            {ach.title}
                          </h3>
                          <Trophy className="w-5 h-5 text-[#ffa000]" />
                        </div>
                        <p className="text-sm text-[#d7ccc8] mb-3">{ach.description}</p>
                        {entry.earnedAt && (
                          <p className="text-xs text-[#d7ccc8] mt-2">
                            Получено: {new Date(entry.earnedAt).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
