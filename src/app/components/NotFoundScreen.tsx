import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Home, MapPinOff } from 'lucide-react';
import { DodoLogo } from '@/app/components/DodoLogo';
import { DustEffect } from '@/app/components/DustEffect';
import { GradientButton } from '@/app/components/GradientButton';

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full dust-effect relative overflow-hidden bg-gradient-to-b from-[#1a1a1a] via-[#2c1810] to-[#1a1a1a]">
      <DustEffect />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-8"
        >
          <DodoLogo size="lg" />
        </motion.div>

        {/* 404 Icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-6"
        >
          <MapPinOff className="w-32 h-32 text-[#ff6f00]" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-6xl md:text-8xl font-bold mb-4 text-center"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <span className="bg-gradient-to-r from-[#d32f2f] to-[#ff6f00] bg-clip-text text-transparent">
            404
          </span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4 text-center"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Заблудились в Диком Западе?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-[#d7ccc8] text-lg mb-8 text-center max-w-md"
        >
          Похоже, этот маршрут ведёт в никуда, partner. Давайте вернёмся на проторенную тропу!
        </motion.p>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <GradientButton
            onClick={() => navigate('/home')}
            size="lg"
          >
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              <span>Вернуться домой</span>
            </div>
          </GradientButton>
        </motion.div>

        {/* Cowboy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mt-12 text-8xl"
        >
          🤠
        </motion.div>
      </div>
    </div>
  );
}