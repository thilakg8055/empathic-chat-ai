import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import type { Message } from '@/types/emotion';
import { EmotionBadge } from './EmotionBadge';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser 
            ? 'bg-gradient-to-br from-primary to-accent' 
            : 'bg-secondary'
          }
        `}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-secondary-foreground" />
        )}
      </motion.div>

      <div className={`flex flex-col gap-1.5 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            px-4 py-3 
            ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}
          `}
        >
          <p className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-foreground'}`}>
            {message.content}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {message.emotion && (
            <EmotionBadge 
              emotion={message.emotion.emotion} 
              confidence={message.emotion.confidence}
              showConfidence
            />
          )}
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
