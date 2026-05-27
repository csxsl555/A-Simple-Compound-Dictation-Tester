import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Route for generating dictation (proxied server-side securely)
  app.post("/api/generate-dictation", async (req, res) => {
    try {
      const { topic, difficulty, minWords, maxWords, provider, deepseekKey, deepseekEndpoint, geminiKey } = req.body;

      const lengthInstruction = minWords && maxWords
        ? `The text MUST be strictly between ${minWords} and ${maxWords} words in length.`
        : "The text should be around 60-100 words.";

      const prompt = `
        Create a compound dictation test paragraph about "${topic}" at a ${difficulty} level.
        ${lengthInstruction}
        Select 6 to 10 key words or short phrases to be 'blanks' and wrap them in curly braces like {this}.
        Examples of blanks: {resilient}, {cut down on}, {sustainable}.
        
        Return strict JSON matching this schema:
        {
          "title": "A short title",
          "content": "The full text with {braced} words."
        }
      `;

      if (provider === "gemini") {
        const activeKey = geminiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!activeKey) {
          return res.status(400).json({ error: "Gemini API Key 未提供。请点击右上角「API 设置」配置您的个人 API Key。" });
        }

        const ai = new GoogleGenAI({ apiKey: activeKey });
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
        if (!text) {
          throw new Error("Gemini 返回内容为空");
        }
        return res.json(JSON.parse(text));

      } else {
        // DeepSeek proxy flow (default)
        const activeKey = deepseekKey || process.env.DEEPSEEK_API_KEY;
        if (!activeKey) {
          return res.status(400).json({ error: "DeepSeek API Key 未提供。请点击右上角「API 设置」配置您的个人 API Key。" });
        }

        let endpoint = (deepseekEndpoint || "https://api.deepseek.com").trim();
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

        const fetchResponse = await fetch(callUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeKey}`
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

        if (!fetchResponse.ok) {
          const errText = await fetchResponse.text();
          throw new Error(`DeepSeek API 状态异常 (${fetchResponse.status}): ${errText}`);
        }

        const data = await fetchResponse.json();
        const resultText = data.choices?.[0]?.message?.content;
        if (!resultText) {
          throw new Error("DeepSeek 返回内容为空");
        }

        const startIdx = resultText.indexOf("{");
        const endIdx = resultText.lastIndexOf("}") + 1;
        const cleanJson = startIdx !== -1 && endIdx !== -1 ? resultText.slice(startIdx, endIdx) : resultText;
        const parsed = JSON.parse(cleanJson);
        return res.json(parsed);
      }

    } catch (err: any) {
      console.error("Error in server dictation generator:", err);
      return res.status(500).json({ error: err.message || "Failed to generate dictation" });
    }
  });

  // API Route for generating high-quality speech text (immediately falls back to browser synthesis)
  app.post("/api/generate-speech", async (req, res) => {
    return res.json({ audio: null });
  });

  // Vite app assets integration
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://localhost:${PORT}`);
  });
}

startServer();
