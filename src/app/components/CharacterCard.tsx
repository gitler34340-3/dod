import { motion } from 'motion/react';
import { useState } from 'react';

interface CharacterCardProps {
  name: string;
  role: string;
  color: string;
  imagePath?: string;
  index: number;
  onClick?: () => void;
}

export function CharacterCard({ name, role, color, imagePath, index, onClick }: CharacterCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Generate image path from name if not provided
  const defaultImagePath = `/characters/${name.toLowerCase().replace(/\s+/g, '-')}.png`;
  const finalImagePath = imagePath || defaultImagePath;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.1 + index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={onClick}
      className="glass rounded-2xl p-4 card-shadow cursor-pointer hover-red-glow relative overflow-hidden"
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
      />
      
      {/* Character Content */}
      <div className="relative z-10">
        <div 
          className="w-full aspect-square rounded-xl mb-3 overflow-hidden flex items-center justify-center"
          style={{ 
            backgroundColor: imageError ? `${color}20` : 'transparent',
            border: `2px solid ${color}`
          }}
        >
          {!imageError ? (
            <img 
              src={finalImagePath}
              alt={name}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
            />
          ) : (
            // Fallback emoji if image not found
            <span className="text-4xl">🤠</span>
          )}
        </div>
        
        <h4 
          className="font-bold text-sm mb-1 text-center"
          style={{ color: 'var(--text-primary)' }}
        >
          {name.split(' ')[0]}
        </h4>
        <p 
          className="text-xs text-center"
          style={{ color: 'var(--text-secondary)' }}
        >
          {role}
        </p>
      </div>

      {/* Active indicator */}
      <div className="absolute top-2 right-2">
        <motion.div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </div>

      {/* Hover overlay effect */}
      <motion.div
        className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
      />
    </motion.div>
  );
}
