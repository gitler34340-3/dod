import React from 'react';
import { motion } from 'motion/react';

interface WantedEmployee {
  id: string;
  name: string;
  position: string;
  reason: string;
  documentTypes: string[];
  severity: 'critical' | 'high' | 'normal';
  daysSinceIssue: number;
}

interface WANTEDSectionProps {
  employees: WantedEmployee[];
  onIssueWarrant: (employee: WantedEmployee) => void;
}

export const WANTEDSection: React.FC<WANTEDSectionProps> = ({
  employees,
  onIssueWarrant,
}) => {
  const severityConfig = {
    critical: { color: 'bg-status-reject', label: '🚨 КРИТИЧНО', icon: '⛔' },
    high: { color: 'bg-status-expired', label: '⚠️ ВЫСОКИЙ', icon: '⚠️' },
    normal: { color: 'bg-status-pending', label: '📌 ОБЫЧНЫЙ', icon: '📌' },
  };

  return (
    <div>
      <div className="
        bg-status-reject text-white p-6 rounded-lg
        mb-8 border-4 border-status-reject
      ">
        <h2 className="
          text-3xl font-serif font-black
          mb-2
        ">
          🚨 РОЗЫСК ДЕШ ЛЮДЯМ
        </h2>
        <p className="
          font-serif italic
          opacity-90
        ">
          {employees.length} сотрудников в списке розыска
        </p>
      </div>

      {/* Горизонтальный скролл карточек */}
      <div className="
        overflow-x-auto pb-4
        -mx-4 md:-mx-8 px-4 md:px-8
      ">
        <div className="
          flex gap-6
          min-w-min
        ">
          {employees.length > 0 ? (
            employees.map((employee, index) => {
              const config = severityConfig[employee.severity];

              return (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="
                    flex-shrink-0 w-80
                    bg-white rounded-lg
                    border-4 border-status-reject
                    p-6
                    shadow-lg
                    hover:shadow-xl
                    transition-shadow
                  "
                >
                  {/* Статус серьёзности */}
                  <div className={`
                    inline-block mb-4
                    px-4 py-2 rounded-full
                    ${config.color} text-white
                    font-serif font-bold text-sm
                  `}>
                    {config.icon} {config.label}
                  </div>

                  {/* Имя */}
                  <h3 className="
                    text-2xl font-serif font-black
                    text-ink-900 mb-1
                  ">
                    {employee.name}
                  </h3>

                  {/* Должность */}
                  <p className="
                    text-sm text-ink-600
                    font-serif mb-4
                  ">
                    {employee.position}
                  </p>

                  {/* Причина */}
                  <div className="
                    bg-parchment-100 p-3 rounded-lg
                    mb-4 border-l-4 border-status-reject
                  ">
                    <p className="
                      text-xs font-serif text-ink-700
                    ">
                      <span className="font-bold">Причина:</span>{' '}
                      {employee.reason}
                    </p>
                    <p className="
                      text-xs font-serif text-ink-600 mt-1
                    ">
                      {employee.daysSinceIssue} дней в списке
                    </p>
                  </div>

                  {/* Документы */}
                  <div className="mb-4">
                    <p className="
                      text-xs font-bold font-serif
                      text-ink-800 mb-2
                    ">
                      Требуемые документы:
                    </p>
                    <div className="
                      flex flex-wrap gap-2
                    ">
                      {employee.documentTypes.map((doc) => (
                        <span
                          key={doc}
                          className="
                            bg-status-reject text-white
                            text-xs px-3 py-1 rounded-full
                            font-serif font-bold
                          "
                        >
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Кнопка ордера */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onIssueWarrant(employee)}
                    className="
                      w-full
                      bg-status-reject text-white
                      px-4 py-2 rounded-lg
                      font-serif font-bold text-sm
                      hover:opacity-90
                      transition-opacity
                    "
                  >
                    📬 Отправить Ордер
                  </motion.button>
                </motion.div>
              );
            })
          ) : (
            <div className="
              w-full text-center py-12
              text-ink-700 font-serif
            ">
              <p className="text-4xl mb-2">🎉</p>
              <p>Все в порядке! Нет разыска</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
