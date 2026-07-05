import { defineTool } from "@lovable.dev/mcp-js";
import { SYLLABUS_SUBJECTS } from "@/lib/syllabus-subjects";

export default defineTool({
  name: "list_syllabus_subjects",
  title: "List syllabus subjects",
  description: "Return the subjects tracked by EduTrack's Exam Portal & PYQs module.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => ({
    content: [{ type: "text", text: JSON.stringify(SYLLABUS_SUBJECTS, null, 2) }],
    structuredContent: { subjects: SYLLABUS_SUBJECTS },
  }),
});
