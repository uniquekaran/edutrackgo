import { createServerFn } from "@tanstack/react-start";

interface AskInput {
  prompt: string;
  history?: { role: "user" | "model"; text: string }[];
}

const SYSTEM_PROMPT = `You are "EduAI Study Buddy", a warm, patient, expert tutor for Indian students.
Specialties: UP Board (Class 9-12) curriculum, NDA (National Defence Academy) written exam prep (Maths, GAT, English, GK), and university-level curriculum (B.Sc, B.Tech, B.A).
Rules:
- Answer in clear, structured markdown. Use short paragraphs, bullet points, and numbered steps.
- When solving problems, show the working step-by-step.
- If a question is off-topic (not academic / career), politely redirect.
- You may mix Hindi + English (Hinglish) casually if the student does; default to English otherwise.
- Keep responses focused and under ~350 words unless a deep explanation is requested.`;

export const askEduAI = createServerFn({ method: "POST" })
  .inputValidator((data: AskInput) => {
    if (!data || typeof data.prompt !== "string" || !data.prompt.trim()) {
      throw new Error("Prompt is required");
    }
    if (data.prompt.length > 4000) throw new Error("Prompt too long");
    return data;
  })
  .handler(async ({ data }) => {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error("GOOGLE_API_KEY not configured");

    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    for (const h of data.history ?? []) {
      if (!h?.text) continue;
      contents.push({ role: h.role, parts: [{ text: h.text }] });
    }
    contents.push({ role: "user", parts: [{ text: data.prompt }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Gemini error", res.status, text);
      throw new Error(`Gemini API ${res.status}`);
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) throw new Error("Empty response from Gemini");
    return { text };
  });
