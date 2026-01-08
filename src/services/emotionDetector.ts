import { pipeline } from '@huggingface/transformers';
import type { EmotionType, EmotionResult } from '@/types/emotion';

// Mapping from model labels to our emotion types
const LABEL_TO_EMOTION: Record<string, EmotionType> = {
  'joy': 'joy',
  'happiness': 'joy',
  'love': 'joy',
  'sadness': 'sadness',
  'anger': 'anger',
  'fear': 'fear',
  'surprise': 'surprise',
  'disgust': 'disgust',
  'neutral': 'neutral',
  'optimism': 'joy',
  'pessimism': 'sadness',
};

const SENTIMENT_MAP: Record<EmotionType, 'positive' | 'negative' | 'neutral'> = {
  joy: 'positive',
  sadness: 'negative',
  anger: 'negative',
  fear: 'negative',
  surprise: 'neutral',
  disgust: 'negative',
  neutral: 'neutral',
};

let classifierInstance: any = null;
let isLoading = false;
let loadError: Error | null = null;

export const getEmotionClassifier = async () => {
  if (classifierInstance) return classifierInstance;
  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (classifierInstance) return classifierInstance;
    if (loadError) throw loadError;
  }

  isLoading = true;
  try {
    console.log('Loading emotion classifier model...');
    classifierInstance = await pipeline(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      { device: 'cpu' }
    );
    console.log('Emotion classifier loaded successfully');
    return classifierInstance;
  } catch (error) {
    loadError = error instanceof Error ? error : new Error('Failed to load model');
    console.error('Failed to load emotion classifier:', error);
    throw loadError;
  } finally {
    isLoading = false;
  }
};

// Keyword-based emotion detection as primary method for better accuracy
const keywordEmotionMap: Record<string, EmotionType> = {
  // Joy keywords
  'happy': 'joy', 'joy': 'joy', 'excited': 'joy', 'great': 'joy', 'wonderful': 'joy',
  'amazing': 'joy', 'love': 'joy', 'fantastic': 'joy', 'awesome': 'joy', 'excellent': 'joy',
  'glad': 'joy', 'pleased': 'joy', 'thrilled': 'joy', 'delighted': 'joy', 'cheerful': 'joy',
  'yay': 'joy', 'woohoo': 'joy', 'hurray': 'joy', 'celebrate': 'joy',
  
  // Sadness keywords
  'sad': 'sadness', 'depressed': 'sadness', 'unhappy': 'sadness', 'miserable': 'sadness',
  'crying': 'sadness', 'tears': 'sadness', 'heartbroken': 'sadness', 'lonely': 'sadness',
  'hopeless': 'sadness', 'disappointed': 'sadness', 'grief': 'sadness', 'sorrow': 'sadness',
  'down': 'sadness', 'blue': 'sadness',
  
  // Anger keywords
  'angry': 'anger', 'furious': 'anger', 'mad': 'anger', 'rage': 'anger', 'hate': 'anger',
  'annoyed': 'anger', 'frustrated': 'anger', 'irritated': 'anger', 'outraged': 'anger',
  'pissed': 'anger', 'livid': 'anger', 'hostile': 'anger',
  
  // Fear keywords
  'scared': 'fear', 'afraid': 'fear', 'terrified': 'fear', 'anxious': 'fear', 'worried': 'fear',
  'nervous': 'fear', 'panic': 'fear', 'frightened': 'fear', 'horror': 'fear', 'dread': 'fear',
  'phobia': 'fear', 'alarmed': 'fear',
  
  // Surprise keywords
  'surprised': 'surprise', 'shocked': 'surprise', 'amazed': 'surprise', 'astonished': 'surprise',
  'wow': 'surprise', 'whoa': 'surprise', 'unexpected': 'surprise', 'unbelievable': 'surprise',
  'omg': 'surprise', 'incredible': 'surprise',
  
  // Disgust keywords
  'disgusted': 'disgust', 'gross': 'disgust', 'revolting': 'disgust', 'nasty': 'disgust',
  'yuck': 'disgust', 'ew': 'disgust', 'repulsive': 'disgust', 'vile': 'disgust',
  'sickening': 'disgust', 'awful': 'disgust',
};

export const detectEmotion = async (text: string): Promise<EmotionResult> => {
  const lowercaseText = text.toLowerCase();
  
  // First try keyword-based detection for accuracy
  let detectedEmotion: EmotionType = 'neutral';
  let highestScore = 0;
  
  for (const [keyword, emotion] of Object.entries(keywordEmotionMap)) {
    if (lowercaseText.includes(keyword)) {
      const score = keyword.length / text.length + 0.5;
      if (score > highestScore) {
        highestScore = score;
        detectedEmotion = emotion;
      }
    }
  }
  
  // If keyword detection found something with decent confidence
  if (highestScore > 0.1) {
    return {
      emotion: detectedEmotion,
      confidence: Math.min(highestScore + 0.3, 0.95),
      sentiment: SENTIMENT_MAP[detectedEmotion],
      timestamp: new Date(),
    };
  }
  
  // Fall back to sentiment analysis model for context
  try {
    const classifier = await getEmotionClassifier();
    const result = await classifier(text);
    
    if (result && result.length > 0) {
      const topResult = result[0];
      const label = topResult.label.toLowerCase();
      const score = topResult.score;
      
      // Map sentiment to emotion
      if (label === 'positive' && score > 0.7) {
        detectedEmotion = 'joy';
      } else if (label === 'negative' && score > 0.7) {
        detectedEmotion = 'sadness';
      }
      
      return {
        emotion: detectedEmotion,
        confidence: score,
        sentiment: SENTIMENT_MAP[detectedEmotion],
        timestamp: new Date(),
      };
    }
  } catch (error) {
    console.error('Error in model-based detection:', error);
  }
  
  return {
    emotion: 'neutral',
    confidence: 0.5,
    sentiment: 'neutral',
    timestamp: new Date(),
  };
};

export const preloadModel = async () => {
  try {
    await getEmotionClassifier();
  } catch (error) {
    console.error('Failed to preload model:', error);
  }
};
