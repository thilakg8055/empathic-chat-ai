import { motion } from 'framer-motion';
import { Brain, Sparkles, Trash2, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMOTION_CONFIG, type EmotionType } from '@/types/emotion';

interface ChatHeaderProps {
  dominantEmotion: EmotionType | null;
  messageCount: number;
  emotionCount: number;
  onClear: () => void;
  onSignOut?: () => void;
  isModelLoading: boolean;
  userName?: string | null;
}

export const ChatHeader = ({ 
  dominantEmotion, 
  messageCount, 
  emotionCount,
  onClear,
  onSignOut,
  isModelLoading,
  userName,
}: ChatHeaderProps) => {
  const emotionConfig = dominantEmotion ? EMOTION_CONFIG[dominantEmotion] : null;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-effect">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          {isModelLoading && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </motion.div>
          )}
        </div>

        <div>
          <h1 className="font-semibold text-foreground flex items-center gap-2">
            EmotiChat
            {emotionConfig && (
              <span className="text-lg">{emotionConfig.icon}</span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isModelLoading 
              ? 'Loading AI model...' 
              : emotionCount > 0 
                ? `${emotionCount} emotions tracked • ${emotionConfig ? emotionConfig.label + ' vibes' : 'Live tracking'}`
                : messageCount > 0
                  ? `${messageCount} messages`
                  : 'Emotion-aware AI assistant'
            }
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {userName && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{userName}</span>
          </div>
        )}

        {messageCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive"
            title="Clear chat & history"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {onSignOut && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.header>
  );
};
