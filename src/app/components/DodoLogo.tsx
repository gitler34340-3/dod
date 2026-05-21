import { motion } from 'motion/react';
import { Pizza } from 'lucide-react';

interface DodoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showBadge?: boolean;
}

export function DodoLogo({ size = 'md', animated = true, showBadge = true }: DodoLogoProps) {
  const sizes = {
    sm: { icon: 'w-12 h-12', badge: 'w-6 h-6 text-xs', badgePos: '-top-1 -right-1' },
    md: { icon: 'w-20 h-20', badge: 'w-8 h-8 text-sm', badgePos: '-top-2 -right-2' },
    lg: { icon: 'w-32 h-32', badge: 'w-12 h-12 text-lg', badgePos: '-top-3 -right-3' }
  };

  const config = sizes[size];

  const LogoContent = (
    <div className="relative">
      <Pizza className={`${config.icon} text-[#ff6f00]`} strokeWidth={1.5} />
      {showBadge && (
        <div className={`absolute ${config.badgePos} ${config.badge} bg-[#d32f2f] rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white font-bold">D</span>
        </div>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        whileHover={{ rotate: 360 }}
      >
        {LogoContent}
      </motion.div>
    );
  }

  return LogoContent;
}
