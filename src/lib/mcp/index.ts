import { defineMcp } from "@lovable.dev/mcp-js";
import askEduAI from "./tools/ask-eduai";
import listColleges from "./tools/list-colleges";
import listSyllabusSubjects from "./tools/list-syllabus-subjects";

export default defineMcp({
  name: "edutrack-mcp",
  title: "EduTrack",
  version: "0.1.0",
  instructions:
    "Tools from EduTrack — an Indian student platform. Use `ask_eduai` to query the EduAI study tutor, `list_colleges` to browse supported institutions, and `list_syllabus_subjects` to see the tracked subjects.",
  tools: [askEduAI, listColleges, listSyllabusSubjects],
});
