import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { LiveEmotionGraph } from '@/components/LiveEmotionGraph';
import { AuthForm } from '@/components/AuthForm';
import { useEmotionChat } from '@/hooks/useEmotionChat';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EmotionType } from '@/types/emotion';

const Index = () => {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  
  const {
    messages,
    isLoading,
    isModelLoading,
    emotionRecords,
    emotionLoading,
    dominantEmotion,
    sendMessage,
    clearMessages,
  } = useEmotionChat(user?.id);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center">
        <motion.div
          className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center p-4">
        <AuthForm onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  const userName = user.user_metadata?.display_name || user.email?.split('@')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 h-[calc(100vh-4rem)]">
          {/* Main Chat Area */}
          <div className="flex flex-col gap-4 min-h-0">
            <ChatHeader
              dominantEmotion={dominantEmotion as EmotionType | null}
              messageCount={messages.length}
              emotionCount={emotionRecords.length}
              onClear={clearMessages}
              onSignOut={signOut}
              isModelLoading={isModelLoading}
              userName={userName}
            />

            {/* Messages */}
            <div className="flex-1 glass-card rounded-2xl p-4 overflow-hidden min-h-0">
              <ScrollArea className="h-full pr-4" ref={scrollRef}>
                <div className="space-y-4 pb-2">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center py-12"
                    >
                      <div className="text-6xl mb-4">💭</div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        Hey {userName}! 👋
                      </h2>
                      <p className="text-muted-foreground max-w-md text-sm">
                        I'm EmotiChat, your emotion-aware AI companion. Share how you're feeling, 
                        and I'll respond with empathy. Your emotions are tracked in real-time!
                      </p>
                      <div className="flex gap-2 mt-6 flex-wrap justify-center">
                        {['😊 "I had a great day!"', '😔 "Feeling down today"', '😤 "So frustrated right now"'].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => sendMessage(suggestion.replace(/^[^\s]+ "/, '').replace(/"$/, ''))}
                            className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <AnimatePresence mode="popLayout">
                        {messages.map((message) => (
                          <ChatMessage key={message.id} message={message} />
                        ))}
                      </AnimatePresence>
                      <AnimatePresence>
                        {isLoading && <TypingIndicator />}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <ChatInput
              onSend={sendMessage}
              disabled={isLoading || isModelLoading}
              placeholder={isModelLoading ? 'Loading emotion model...' : "Share how you're feeling..."}
            />
          </div>

          {/* Sidebar - Live Emotion Graph */}
          <div className="hidden lg:block">
            <LiveEmotionGraph
              emotionRecords={emotionRecords.map(r => ({
                ...r,
                emotion: r.emotion as EmotionType,
              }))}
              loading={emotionLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
