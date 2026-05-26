import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GeneratedContentResponse } from "../types";

/**
 * Retrieves the current configured settings from localStorage or fallback environment variables.
 */
export const getSettings = () => {
  if (typeof window === "undefined") {
    return {
      provider: "gemini",
      geminiKey: "",
      deepseekKey: "",
      deepseekEndpoint: "https://api.deepseek.com"
    };
  }

  const provider = localStorage.getItem("CD_AI_PROVIDER") || "gemini";
  const customGeminiKey = localStorage.getItem("CD_GEMINI_KEY") || "";
  const customDeepSeekKey = localStorage.getItem("CD_DEEPSEEK_KEY") || "";
  const customDeepSeekEndpoint = localStorage.getItem("CD_DEEPSEEK_ENDPOINT") || "https://api.deepseek.com";

  // Fallback to process.env for standard configured instances
  const envGeminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";

  return {
    provider,
    geminiKey: customGeminiKey || envGeminiKey,
    deepseekKey: customDeepSeekKey,
    deepseekEndpoint: customDeepSeekEndpoint || "https://api.deepseek.com"
  };
};

/**
 * Save settings back to localStorage
 */
export const saveSettings = (provider: string, geminiKey: string, deepseekKey: string, deepseekEndpoint: string) => {
  localStorage.setItem("CD_AI_PROVIDER", provider);
  localStorage.setItem("CD_GEMINI_KEY", geminiKey);
  localStorage.setItem("CD_DEEPSEEK_KEY", deepseekKey);
  localStorage.setItem("CD_DEEPSEEK_ENDPOINT", deepseekEndpoint);
};

export const generateDictationContent = async (topic: string, difficulty: string): Promise<GeneratedContentResponse> => {
  const settings = getSettings();
  
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

  // DeepSeek Router Flow
  if (settings.provider === "deepseek") {
    if (!settings.deepseekKey) {
      throw new Error("DeepSeek API Key 未设置。请点击页面右上角⚙️图标配置API Key。");
    }

    // Process endpoints
    let endpoint = settings.deepseekEndpoint.trim();
    if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
      endpoint = "https://" + endpoint;
    }
    endpoint = endpoint.replace(/\/+$/, "");

    let callUrl = endpoint;
    if (!callUrl.endsWith("/chat/completions")) {
      if (callUrl.endsWith("/v1")) {
        callUrl = callUrl + "/chat/completions";
      } else {
        callUrl = callUrl + "/v1/chat/completions";
      }
    }

    const response = await fetch(callUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.deepseekKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a professional English language teacher. Return JSON strictly matching the requested schema. Do not output any markdown blocks or explanation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API 请求状态异常 (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;
    if (!resultText) {
      throw new Error("DeepSeek 返回内容为空");
    }

    try {
      const startIdx = resultText.indexOf("{");
      const endIdx = resultText.lastIndexOf("}") + 1;
      const cleanJson = startIdx !== -1 && endIdx !== -1 ? resultText.slice(startIdx, endIdx) : resultText;
      return JSON.parse(cleanJson) as GeneratedContentResponse;
    } catch (e) {
      console.error("Failed to parse DeepSeek JSON response:", resultText, e);
      throw new Error("DeepSeek 没有返回标准的 JSON 格式，请重试。");
    }
  }

  // Google Gemini Standard Flow
  const apiKey = settings.geminiKey;
  if (!apiKey) {
    throw new Error("Gemini API Key 未设置。请点击页面右上角⚙️图标配置API Key。");
  }

  const ai = new GoogleGenAI({ apiKey });
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

export const generateSpeech = async (text: string): Promise<string | null> => {
  const settings = getSettings();
  
  // Use high-quality Gemini TTS ONLY if Gemini API Key is available
  const apiKey = settings.geminiKey;
  if (!apiKey) {
    // Return null, falling back to browser Speech Synthesis automatically
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const cleanText = text.replace(/\{/g, "").replace(/\}/g, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.warn("Google TTS generation failed or was bypassed. System is using window speech synthesis fallback.", error);
    return null;
  }
};
