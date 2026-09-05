
import { GoogleGenAI, Type } from "@google/genai";
import { ModerationResult } from "../types";

// Always use the process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const moderateContent = async (text: string): Promise<ModerationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following content for toxicity, hate speech, or negativity. 
      The platform is "Goodwall", a positive-only appreciation system. 
      Content: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            sentiment: { type: Type.STRING }
          },
          required: ["isSafe", "sentiment"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as ModerationResult;
  } catch (error) {
    console.error("Moderation error:", error);
    return { isSafe: true, sentiment: "neutral" }; // Fallback
  }
};

export const refineText = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return text;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert editor for a heartfelt appreciation and recognition platform called Heartboard.
Refine the following text to improve grammar, clarity, readability, and wording while preserving the user's original heartfelt intent and tone. Return ONLY the refined text without markdown quotes or explanation.

Text to refine: "${text}"`,
    });
    return response.text?.trim().replace(/^["']|["']$/g, '') || text;
  } catch (error) {
    console.error("Refine text error:", error);
    return text;
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Audio
            }
          },
          { text: "Transcribe this audio appreciation message into text." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
};
