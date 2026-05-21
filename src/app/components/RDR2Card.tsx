import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface RDR2CardProps {
  children: ReactNode;
  onClick?: () => void;
  gradient?: string;
  className?: string;
  hoverable?: boolean;
  glowEffect?: 'none' | 'common' | 'rare' | 'legendary';
}

export function RDR2Card({
  children,
  onClick,
  gradient,
  className = '',
  hoverable = true,
  glowEffect = 'none'
}: RDR2CardProps) {
  const glowClasses = {
    none: '',
    common: 'glow-common',
    rare: 'glow-rare',
    legendary: 'glow-legendary'
  };

  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.02, y: -5 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        glass
        rounded-2xl
        p-6
        card-shadow-lg
        relative
        overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${glowClasses[glowEffect]}
        ${className}
      `}
    >
      {/* Gradient Overlay */}
      {gradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 pointer-events-none`} />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
