import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { COLLEGES } from "@/lib/colleges";

export default defineTool({
  name: "list_colleges",
  title: "List supported colleges",
  description: "Return the curated list of Indian higher-education institutions supported by EduTrack. Optionally filter by a case-insensitive substring.",
  inputSchema: {
    query: z.string().optional().describe("Optional substring filter, case-insensitive."),
    limit: z.number().int().min(1).max(200).optional().describe("Max results to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const q = (query ?? "").trim().toLowerCase();
    const max = limit ?? 50;
    const matches = (q ? COLLEGES.filter((c) => c.toLowerCase().includes(q)) : [...COLLEGES]).slice(0, max);
    return {
      content: [{ type: "text", text: JSON.stringify(matches, null, 2) }],
      structuredContent: { count: matches.length, total: COLLEGES.length, colleges: matches },
    };
  },
});
