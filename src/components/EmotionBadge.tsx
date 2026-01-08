import { motion } from 'framer-motion';
import { EMOTION_CONFIG, type EmotionType } from '@/types/emotion';

interface EmotionBadgeProps {
  emotion: EmotionType;
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
}

export const EmotionBadge = ({ 
  emotion, 
  confidence, 
  size = 'sm',
  showConfidence = false 
}: EmotionBadgeProps) => {
  const config = EMOTION_CONFIG[emotion];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        emotion-badge
        ${config.bgColor}
        ${config.color}
        ${sizeClasses[size]}
      `}
    >
      <span>{config.icon}</span>
      <span className="font-medium">{config.label}</span>
      {showConfidence && (
        <span className="opacity-70">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </motion.span>
  );
};
