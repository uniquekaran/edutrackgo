// Canonical subject list shared between the Admin "Upload Syllabus" module
// and the Student "Exam Portal & PYQs" module. Keep this in sync with the
// PAPERS list rendered on /student/exams.
export const SYLLABUS_SUBJECTS = [
  "Engineering Mathematics",
  "Data Structures & Algorithms",
  "Operating Systems",
  "Digital Electronics",
  "Database Management Systems",
  "Financial Accounting",
  "Microeconomics",
  "Organic Chemistry",
  "Pharmaceutical Analysis",
  "Workshop Practice",
] as const;

export type SyllabusSubject = (typeof SYLLABUS_SUBJECTS)[number];

// Marker stored in learning_materials.module to tag rows uploaded via the
// syllabus CMS (separate from generic PPTs/notes).
export const SYLLABUS_MODULE_TAG = "syllabus";
