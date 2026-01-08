import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EmotionType } from '@/types/emotion';

interface EmotionRecord {
  id: string;
  emotion: EmotionType;
  confidence: number;
  sentiment: string;
  message_preview: string | null;
  created_at: string;
}

export const useEmotionDatabase = (userId: string | undefined) => {
  const [emotionRecords, setEmotionRecords] = useState<EmotionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing emotion history
  useEffect(() => {
    if (!userId) {
      setEmotionRecords([]);
      setLoading(false);
      return;
    }

    const fetchEmotions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('emotion_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching emotions:', error);
      } else {
        setEmotionRecords((data || []) as EmotionRecord[]);
      }
      setLoading(false);
    };

    fetchEmotions();
  }, [userId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('emotion-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emotion_history',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New emotion received:', payload);
          setEmotionRecords(prev => [...prev, payload.new as EmotionRecord]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const saveEmotion = useCallback(async (
    emotion: EmotionType,
    confidence: number,
    sentiment: string,
    messagePreview?: string
  ) => {
    if (!userId) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('emotion_history')
      .insert({
        user_id: userId,
        emotion,
        confidence,
        sentiment,
        message_preview: messagePreview?.slice(0, 100),
      });

    if (error) {
      console.error('Error saving emotion:', error);
    }

    return { error };
  }, [userId]);

  const clearEmotions = useCallback(async () => {
    if (!userId) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('emotion_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing emotions:', error);
    } else {
      setEmotionRecords([]);
    }

    return { error };
  }, [userId]);

  return {
    emotionRecords,
    loading,
    saveEmotion,
    clearEmotions,
  };
};
