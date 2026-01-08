import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, EmotionResult, EmotionType } from '@/types/emotion';
import { detectEmotion, preloadModel } from '@/services/emotionDetector';
import { useEmotionDatabase } from './useEmotionDatabase';

export const useEmotionChat = (userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const { emotionRecords, loading: emotionLoading, saveEmotion, clearEmotions } = useEmotionDatabase(userId);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      setIsModelLoading(true);
      try {
        await preloadModel();
      } catch (error) {
        console.error('Failed to preload emotion model:', error);
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // Derive stats from database records
  const emotionStats = useCallback(() => {
    if (emotionRecords.length === 0) return [];
    
    const counts: Record<EmotionType, number> = {
      joy: 0, sadness: 0, anger: 0, fear: 0, 
      surprise: 0, disgust: 0, neutral: 0
    };
    
    emotionRecords.forEach(record => {
      const emotion = record.emotion as EmotionType;
      if (counts[emotion] !== undefined) {
        counts[emotion]++;
      }
    });
    
    return Object.entries(counts)
      .map(([emotion, count]) => ({
        emotion: emotion as EmotionType,
        count,
        percentage: (count / emotionRecords.length) * 100,
      }))
      .filter(stat => stat.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [emotionRecords]);

  const dominantEmotion = useCallback((): EmotionType | null => {
    const stats = emotionStats();
    return stats.length > 0 ? stats[0].emotion : null;
  }, [emotionStats]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Detect emotion in user message
    let userEmotion: EmotionResult | undefined;
    try {
      userEmotion = await detectEmotion(content);
      
      // Save to database if user is authenticated
      if (userId && userEmotion) {
        await saveEmotion(
          userEmotion.emotion,
          userEmotion.confidence,
          userEmotion.sentiment,
          content
        );
      }
    } catch (error) {
      console.error('Emotion detection failed:', error);
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      emotion: userEmotion,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    let assistantContent = '';
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    try {
      const chatUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emotion-chat`;
      
      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          emotionContext: userEmotion ? {
            emotion: userEmotion.emotion,
            confidence: userEmotion.confidence,
            sentiment: userEmotion.sentiment,
          } : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get response' }));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantMessage.id 
                    ? { ...m, content: assistantContent } 
                    : m
                )
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
            }
          } catch { /* ignore */ }
        }
        setMessages(prev => 
          prev.map(m => 
            m.id === assistantMessage.id 
              ? { ...m, content: assistantContent } 
              : m
          )
        );
      }

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('Chat error:', error);
      
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: "I'm sorry, I couldn't process that right now. Please try again." } 
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, userId, saveEmotion]);

  const clearMessages = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    if (userId) {
      await clearEmotions();
    }
  }, [userId, clearEmotions]);

  return {
    messages,
    isLoading,
    isModelLoading,
    emotionRecords,
    emotionLoading,
    emotionStats: emotionStats(),
    dominantEmotion: dominantEmotion(),
    sendMessage,
    clearMessages,
  };
};
