import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSend, disabled = false, placeholder }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="relative"
    >
      <div className="glass-card rounded-2xl p-2 flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Share how you're feeling..."}
            disabled={disabled}
            rows={1}
            className="
              w-full px-4 py-3 bg-transparent border-0 resize-none
              text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-0
              text-sm leading-relaxed
              disabled:opacity-50
            "
          />
        </div>

        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          size="icon"
          className="
            h-10 w-10 rounded-xl
            bg-gradient-to-r from-primary to-accent
            hover:opacity-90 transition-opacity
            disabled:opacity-50
          "
        >
          {disabled ? (
            <Sparkles className="w-4 h-4 animate-pulse" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2">
        AI-powered emotional support • Responses are generated and may not be perfect
      </p>
    </motion.form>
  );
};
