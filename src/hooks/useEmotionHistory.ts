import { useState, useCallback, useMemo } from 'react';
import type { EmotionHistory, EmotionStats, EmotionType } from '@/types/emotion';

const MAX_HISTORY_SIZE = 100;

export const useEmotionHistory = () => {
  const [history, setHistory] = useState<EmotionHistory[]>([]);

  const addEmotion = useCallback((emotion: EmotionType, confidence: number) => {
    const newEntry: EmotionHistory = {
      emotion,
      confidence,
      timestamp: new Date(),
    };

    setHistory(prev => {
      const updated = [...prev, newEntry];
      if (updated.length > MAX_HISTORY_SIZE) {
        return updated.slice(-MAX_HISTORY_SIZE);
      }
      return updated;
    });
  }, []);

  const stats = useMemo((): EmotionStats[] => {
    if (history.length === 0) return [];

    const counts: Record<EmotionType, number> = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 0,
    };

    history.forEach(entry => {
      counts[entry.emotion]++;
    });

    return Object.entries(counts)
      .map(([emotion, count]) => ({
        emotion: emotion as EmotionType,
        count,
        percentage: (count / history.length) * 100,
      }))
      .filter(stat => stat.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [history]);

  const dominantEmotion = useMemo((): EmotionType | null => {
    if (stats.length === 0) return null;
    return stats[0].emotion;
  }, [stats]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const recentEmotions = useMemo(() => {
    return history.slice(-10);
  }, [history]);

  return {
    history,
    stats,
    dominantEmotion,
    recentEmotions,
    addEmotion,
    clearHistory,
  };
};
