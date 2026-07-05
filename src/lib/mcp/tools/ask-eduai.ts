import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const SYSTEM_PROMPT = `You are "EduAI Study Buddy", a warm expert tutor for Indian students (UP Board, NDA, B.Sc/B.Tech/B.A). Answer in clear markdown, keep responses focused.`;

export default defineTool({
  name: "ask_eduai",
  title: "Ask EduAI Study Buddy",
  description: "Ask the EduTrack EduAI tutor an academic question (UP Board, NDA prep, or B.Tech/B.Sc/B.A syllabus).",
  inputSchema: {
    prompt: z.string().min(1).max(4000).describe("The student's question."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ prompt }) => {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
      return { content: [{ type: "text", text: "GOOGLE_API_KEY is not configured on the server." }], isError: true };
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { content: [{ type: "text", text: `Gemini API error ${res.status}: ${errText}` }], isError: true };
    }
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return { content: [{ type: "text", text: text || "(empty response)" }] };
  },
});
