import { GeneratedContentResponse } from "../types";

export const generateDictationContent = async (
  topic: string, 
  difficulty: string,
  minWords?: number,
  maxWords?: number
): Promise<GeneratedContentResponse> => {
  // Call server proxy to leverage direct system DeepSeek API
  const response = await fetch("/api/generate-dictation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic,
      difficulty,
      minWords,
      maxWords
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `请求失败 (${response.status})。请稍后重试。`);
  }

  return response.json();
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  // Return null to directly fall back to local high-quality system browser speech synthesis
  return null;
};
