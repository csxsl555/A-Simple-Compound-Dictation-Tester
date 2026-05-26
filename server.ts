import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Route for generating dictation (proxied server-side securely using DeepSeek)
  app.post("/api/generate-dictation", async (req, res) => {
    try {
      const { topic, difficulty, minWords, maxWords } = req.body;

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

      const activeDeepseekKey = "sk-005f859a9d2f4b5ba49c71fdac048c0f";
      const callUrl = "https://api.deepseek.com/v1/chat/completions";

      const fetchResponse = await fetch(callUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeDeepseekKey}`
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
