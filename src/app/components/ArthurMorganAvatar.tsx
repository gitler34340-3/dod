import { motion } from 'motion/react';

interface ArthurMorganAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export function ArthurMorganAvatar({ size = 'md', animated = true, className = '' }: ArthurMorganAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const emojiSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  const AvatarContent = (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#d32f2f] to-[#ff6f00] p-0.5 ${className}`}>
      <div className="w-full h-full rounded-full bg-[#2c1810] flex items-center justify-center">
        <span className={emojiSizes[size]}>🤠</span>
      </div>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {AvatarContent}
      </motion.div>
    );
  }

  return AvatarContent;
}