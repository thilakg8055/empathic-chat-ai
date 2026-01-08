import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { EmotionHistory, EmotionStats, EmotionType } from '@/types/emotion';
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

interface EmotionTrendChartProps {
  history: EmotionHistory[];
  stats: EmotionStats[];
}

export const EmotionTrendChart = ({ history, stats }: EmotionTrendChartProps) => {
  const timelineData = useMemo(() => {
    if (history.length === 0) return [];

    return history.slice(-20).map((entry, index) => ({
      index,
      time: entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: entry.emotion,
      value: entry.confidence * 100,
      color: EMOTION_COLORS[entry.emotion],
    }));
  }, [history]);

  const pieData = useMemo(() => {
    return stats.map(stat => ({
      name: EMOTION_CONFIG[stat.emotion].label,
      value: stat.count,
      color: EMOTION_COLORS[stat.emotion],
      icon: EMOTION_CONFIG[stat.emotion].icon,
    }));
  }, [stats]);

  if (history.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="font-semibold text-foreground mb-1">No Data Yet</h3>
        <p className="text-sm text-muted-foreground">
          Start chatting to see your emotion trends
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-2xl p-6 h-full flex flex-col gap-6"
    >
      <div>
        <h3 className="font-semibold text-foreground mb-1">Emotion Distribution</h3>
        <p className="text-xs text-muted-foreground">Your emotional journey so far</p>
      </div>

      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-card rounded-lg px-3 py-2 text-sm">
                      <span>{data.icon} {data.name}: {data.value}</span>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {pieData.slice(0, 4).map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-1.5 text-xs"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.icon} {item.name}</span>
          </div>
        ))}
      </div>

      {timelineData.length > 3 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Recent Trend</h4>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const config = EMOTION_CONFIG[data.emotion as EmotionType];
                      return (
                        <div className="glass-card rounded-lg px-3 py-2 text-sm">
                          <span>{config.icon} {config.label}: {Math.round(data.value)}%</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#emotionGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
};
