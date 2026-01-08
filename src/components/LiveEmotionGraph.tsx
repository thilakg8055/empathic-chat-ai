import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { EmotionType } from '@/types/emotion';
import { EMOTION_CONFIG } from '@/types/emotion';

const EMOTION_COLORS: Record<EmotionType, string> = {
  joy: '#EAB308',
  sadness: '#3B82F6',
  anger: '#EF4444',
  fear: '#A855F7',
  surprise: '#06B6D4',
  disgust: '#22C55E',
  neutral: '#6B7280',
};

const EMOTION_VALUES: Record<EmotionType, number> = {
  joy: 100,
  surprise: 75,
  neutral: 50,
  sadness: 30,
  fear: 20,
  anger: 15,
  disgust: 10,
};

interface EmotionRecord {
  id: string;
  emotion: EmotionType;
  confidence: number;
  sentiment: string;
  created_at: string;
}

interface LiveEmotionGraphProps {
  emotionRecords: EmotionRecord[];
  loading: boolean;
}

export const LiveEmotionGraph = ({ emotionRecords, loading }: LiveEmotionGraphProps) => {
  const timelineData = useMemo(() => {
    return emotionRecords.slice(-30).map((record, index) => ({
      index,
      time: new Date(record.created_at).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      emotion: record.emotion,
      value: EMOTION_VALUES[record.emotion as EmotionType] || 50,
      confidence: Math.round(record.confidence * 100),
      color: EMOTION_COLORS[record.emotion as EmotionType] || EMOTION_COLORS.neutral,
    }));
  }, [emotionRecords]);

  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    emotionRecords.forEach(record => {
      counts[record.emotion] = (counts[record.emotion] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([emotion, count]) => ({
        emotion,
        count,
        color: EMOTION_COLORS[emotion as EmotionType] || EMOTION_COLORS.neutral,
        icon: EMOTION_CONFIG[emotion as EmotionType]?.icon || '😐',
        label: EMOTION_CONFIG[emotion as EmotionType]?.label || emotion,
      }))
      .sort((a, b) => b.count - a.count);
  }, [emotionRecords]);

  const avgSentiment = useMemo(() => {
    if (emotionRecords.length === 0) return 50;
    const total = emotionRecords.reduce((sum, r) => {
      return sum + (EMOTION_VALUES[r.emotion as EmotionType] || 50);
    }, 0);
    return Math.round(total / emotionRecords.length);
  }, [emotionRecords]);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 h-full flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (emotionRecords.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">📈</div>
        <h3 className="font-semibold text-foreground mb-2">Your Emotion Journey</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Start chatting to see your emotions tracked in real-time with live graphs
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-2xl p-5 h-full flex flex-col gap-5 overflow-hidden"
    >
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Live Emotions</h3>
          <p className="text-xs text-muted-foreground">
            {emotionRecords.length} recorded • Updated in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ 
              backgroundColor: avgSentiment > 60 
                ? 'rgba(234, 179, 8, 0.2)' 
                : avgSentiment > 40 
                  ? 'rgba(107, 114, 128, 0.2)' 
                  : 'rgba(59, 130, 246, 0.2)' 
            }}
          >
            {avgSentiment > 60 ? '😊' : avgSentiment > 40 ? '😐' : '😔'}
          </div>
        </div>
      </div>

      {/* Live Timeline Chart */}
      <div className="flex-1 min-h-[120px]">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Emotion Timeline</h4>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={timelineData}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={[0, 110]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const config = EMOTION_CONFIG[data.emotion as EmotionType];
                  return (
                    <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg">
                      <div className="flex items-center gap-2">
                        <span>{config?.icon}</span>
                        <span className="font-medium">{config?.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Confidence: {data.confidence}%
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={props.key}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={payload.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7, stroke: 'white', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Emotion Distribution */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Distribution</h4>
        <div className="h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={emotionCounts.slice(0, 6)} layout="horizontal">
              <XAxis 
                dataKey="icon" 
                tick={{ fontSize: 14 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-lg">
                        <span>{data.icon} {data.label}: {data.count}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {emotionCounts.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Emotions Strip */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent</h4>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {emotionRecords.slice(-12).reverse().map((record, i) => {
            const config = EMOTION_CONFIG[record.emotion as EmotionType];
            return (
              <motion.div
                key={record.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: `${EMOTION_COLORS[record.emotion as EmotionType]}20` }}
                title={`${config?.label} - ${Math.round(record.confidence * 100)}%`}
              >
                {config?.icon}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
