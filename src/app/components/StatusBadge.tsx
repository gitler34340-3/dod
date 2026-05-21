import { motion } from 'motion/react';

interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'conflict' | 'success' | 'warning' | 'error';
  text: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, text, animated = true, size = 'md' }: StatusBadgeProps) {
  const statusColors = {
    confirmed: 'bg-[#4caf50]',
    success: 'bg-[#4caf50]',
    pending: 'bg-[#fbc02d]',
    warning: 'bg-[#fbc02d]',
    conflict: 'bg-[#f44336]',
    error: 'bg-[#f44336]'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const BadgeContent = (
    <span
      className={`
        inline-block
        ${statusColors[status]}
        text-white
        font-semibold
        rounded-full
        ${sizes[size]}
      `}
    >
      {text}
    </span>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {BadgeContent}
      </motion.div>
    );
  }

  return BadgeContent;
}
