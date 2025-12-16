import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GeneratedContentResponse } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDictationContent = async (topic: string, difficulty: string): Promise<GeneratedContentResponse> => {
  const ai = getClient();
  const prompt = `
    Create a compound dictation test paragraph about "${topic}" at a ${difficulty} level.
    The text should be around 60-100 words.
    Select 6 to 10 key words or short phrases to be 'blanks' and wrap them in curly braces like {this}.
    Examples of blanks: {resilient}, {cut down on}, {sustainable}.
    
    Return strict JSON matching this schema:
    {
      "title": "A short title",
      "content": "The full text with {braced} words."
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        required: ["title", "content"]
      }
    },
  });

  const text = response.text;
  if (!text) throw new Error("No content generated");
  return JSON.parse(text) as GeneratedContentResponse;
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getClient();
  // Strip braces for the TTS engine so it reads naturally
  const cleanText = text.replace(/\{/g, "").replace(/\}/g, "");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: cleanText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, clear voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate audio data");
  }
  return base64Audio;
};
