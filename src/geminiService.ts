import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_FLASH } from "../constants";

// NOTE: In a real production app, you should proxy this request through your backend
// to protect your API KEY. For this specific request structure where no backend is provided,
// we assume process.env.API_KEY is available or the user enters it (simulated here).
// We will use a placeholder to demonstrate the structure, but in the actual running environment,
// ensure process.env.API_KEY is set.

const getClient = () => {
    // Fallback for demo if process.env is not populated in this specific runtime
    const key = process.env.API_KEY || localStorage.getItem('GEMINI_API_KEY') || '';
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
};

export const generateAIResponse = async (prompt: string): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "Please set your Gemini API Key in settings or environment variables to use AI features.";
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FLASH,
      contents: prompt,
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I am having trouble connecting to the AI brain right now.";
  }
};