// Mock data for the EduAI network flow. Structured to swap for Supabase later.
export const UNIVERSITIES = [
  "IIT Bombay",
  "IIT Delhi",
  "IIT Madras",
  "Delhi University",
  "Banaras Hindu University",
  "University of Lucknow",
  "AKTU Lucknow",
  "Jamia Millia Islamia",
  "Jadavpur University",
  "Anna University",
  "University of Mumbai",
  "Osmania University",
] as const;

export const COURSES = ["B.Tech", "B.Sc", "B.A", "B.Com", "BBA", "BCA"] as const;
export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;
export const SECTIONS = ["A", "B", "C", "D"] as const;

export type Course = (typeof COURSES)[number];

export interface MockClassmate {
  id: string;
  name: string;
  rollNumber: string;
}
export interface MockTeacher {
  id: string;
  name: string;
  subject: string;
  designation: string;
}

const FIRST = ["Aarav","Ishaan","Kabir","Vihaan","Reyansh","Aditya","Ananya","Diya","Aadhya","Saanvi","Myra","Kiara","Riya","Priya","Anaya","Ayaan","Arjun","Rohan","Karan","Neha","Aisha","Zara","Mehak","Isha"];
const LAST = ["Sharma","Verma","Gupta","Singh","Yadav","Mishra","Pandey","Chauhan","Tiwari","Srivastava","Khan","Kapoor","Malhotra","Nair","Iyer","Menon","Das","Bose","Roy","Reddy"];

export function generateClassmates(seed: string, count = 22): MockClassmate[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rng = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[Math.floor(rng() * FIRST.length)];
    const last = LAST[Math.floor(rng() * LAST.length)];
    const num = String(101 + i).padStart(3, "0");
    return {
      id: `${seed}-${i}`,
      name: `${first} ${last}`,
      rollNumber: `EDU-${seed.slice(0, 3).toUpperCase()}-${num}`,
    };
  });
}

const TEACHER_MAP: Record<string, MockTeacher[]> = {
  "B.Tech": [
    { id: "t-bt-1", name: "Dr. Rajesh Kumar", subject: "Data Structures", designation: "Professor" },
    { id: "t-bt-2", name: "Dr. Sunita Rao", subject: "Discrete Mathematics", designation: "Associate Prof." },
    { id: "t-bt-3", name: "Prof. Manoj Bhat", subject: "Digital Electronics", designation: "Assistant Prof." },
    { id: "t-bt-4", name: "Dr. Kavita Menon", subject: "Operating Systems", designation: "Professor" },
    { id: "t-bt-5", name: "Prof. Anand Iyer", subject: "Engineering Physics", designation: "Assistant Prof." },
  ],
  "B.Sc": [
    { id: "t-bs-1", name: "Dr. Meera Joshi", subject: "Organic Chemistry", designation: "Professor" },
    { id: "t-bs-2", name: "Dr. Vikram Sethi", subject: "Calculus & Analysis", designation: "Associate Prof." },
    { id: "t-bs-3", name: "Prof. Neelam Das", subject: "Molecular Biology", designation: "Assistant Prof." },
    { id: "t-bs-4", name: "Dr. Prakash Mishra", subject: "Statistics", designation: "Professor" },
  ],
  "B.A": [
    { id: "t-ba-1", name: "Dr. Anjali Trivedi", subject: "Modern Indian History", designation: "Professor" },
    { id: "t-ba-2", name: "Dr. Farhan Qureshi", subject: "Political Theory", designation: "Associate Prof." },
    { id: "t-ba-3", name: "Prof. Latha Krishnan", subject: "English Literature", designation: "Assistant Prof." },
    { id: "t-ba-4", name: "Dr. Sameer Bhatt", subject: "Sociology", designation: "Professor" },
  ],
};

export function teachersForCourse(course: string): MockTeacher[] {
  return TEACHER_MAP[course] ?? [
    { id: "t-x-1", name: "Dr. Faculty A", subject: "Core Paper I", designation: "Professor" },
    { id: "t-x-2", name: "Prof. Faculty B", subject: "Core Paper II", designation: "Assistant Prof." },
  ];
}
