export type EmotionType = 
  | 'joy' 
  | 'sadness' 
  | 'anger' 
  | 'fear' 
  | 'surprise' 
  | 'disgust' 
  | 'neutral';

export interface EmotionResult {
  emotion: EmotionType;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: EmotionResult;
}

export interface EmotionHistory {
  emotion: EmotionType;
  confidence: number;
  timestamp: Date;
}

export interface EmotionStats {
  emotion: EmotionType;
  count: number;
  percentage: number;
}

export const EMOTION_CONFIG: Record<EmotionType, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: string;
}> = {
  joy: {
    label: 'Joy',
    color: 'text-emotion-joy',
    bgColor: 'bg-emotion-joy/20',
    icon: '😊',
  },
  sadness: {
    label: 'Sadness',
    color: 'text-emotion-sadness',
    bgColor: 'bg-emotion-sadness/20',
    icon: '😢',
  },
  anger: {
    label: 'Anger',
    color: 'text-emotion-anger',
    bgColor: 'bg-emotion-anger/20',
    icon: '😠',
  },
  fear: {
    label: 'Fear',
    color: 'text-emotion-fear',
    bgColor: 'bg-emotion-fear/20',
    icon: '😨',
  },
  surprise: {
    label: 'Surprise',
    color: 'text-emotion-surprise',
    bgColor: 'bg-emotion-surprise/20',
    icon: '😲',
  },
  disgust: {
    label: 'Disgust',
    color: 'text-emotion-disgust',
    bgColor: 'bg-emotion-disgust/20',
    icon: '🤢',
  },
  neutral: {
    label: 'Neutral',
    color: 'text-emotion-neutral',
    bgColor: 'bg-emotion-neutral/20',
    icon: '😐',
  },
};
