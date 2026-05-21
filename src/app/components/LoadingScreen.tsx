import { motion } from 'motion/react';
import { DodoLogo } from '@/app/components/DodoLogo';
import { DustEffect } from '@/app/components/DustEffect';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Загрузка Дикого Запада...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen w-full dust-effect relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] via-[#2c1810] to-[#1a1a1a] flex items-center justify-center">
      <DustEffect />
      
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <DodoLogo size="lg" animated={true} />
        
        {/* Loading Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-[#d7ccc8] text-lg text-center"
        >
          {message}
        </motion.p>
        
        {/* Loading Bar */}
        <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#d32f2f] to-[#ff6f00]"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut"
            }}
            style={{ width: '50%' }}
          />
        </div>
        
        {/* Spinning Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "linear"
          }}
          className="text-4xl"
        >
          🤠
        </motion.div>
      </div>
    </div>
  );
}
