import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmotionContext {
  emotion: string;
  confidence: number;
  sentiment: string;
}

const getEmotionAwareSystemPrompt = (emotionContext?: EmotionContext): string => {
  const basePrompt = `You are EmotiChat, an empathetic AI assistant that provides emotionally intelligent support. 
You understand human emotions and adapt your responses accordingly. Be warm, supportive, and genuine.
Keep responses concise (2-3 sentences max) but meaningful.`;

  if (!emotionContext || emotionContext.confidence < 0.3) {
    return basePrompt;
  }

  const emotionPrompts: Record<string, string> = {
    joy: `The user seems happy! Match their positive energy with enthusiasm. Celebrate with them and encourage their good mood.`,
    sadness: `The user seems sad. Be gentle, empathetic, and validating. Acknowledge their feelings and offer comfort without being dismissive.`,
    anger: `The user seems frustrated or angry. Stay calm, validate their feelings, and help them process. Don't be dismissive or defensive.`,
    fear: `The user seems anxious or worried. Be reassuring and grounding. Help them feel safe and provide perspective without minimizing their concerns.`,
    surprise: `The user seems surprised! Share in their amazement and help them process the unexpected.`,
    disgust: `The user seems uncomfortable about something. Acknowledge their reaction and provide supportive perspective.`,
    neutral: `The user seems calm. Maintain a friendly, balanced tone.`,
  };

  const emotionGuide = emotionPrompts[emotionContext.emotion] || emotionPrompts.neutral;
  return `${basePrompt}\n\nCurrent emotional context: ${emotionGuide}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, emotionContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat request with emotion context:", emotionContext);

    const systemPrompt = getEmotionAwareSystemPrompt(emotionContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
