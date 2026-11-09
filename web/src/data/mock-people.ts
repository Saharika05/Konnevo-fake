export type MockPerson = {
  id: string;
  name: string;
  college: string;
  skills: string[];
  interests: string[];
};

const FIRST = [
  "Meera",
  "Arjun",
  "Sana",
  "Rahul",
  "Isha",
  "Dev",
  "Ananya",
  "Kabir",
  "Nisha",
  "Vikram",
  "Tara",
  "Rohan",
  "Diya",
  "Aman",
  "Pooja",
  "Karthik",
  "Zoya",
  "Ishaan",
  "Lakshmi",
  "Neil",
];
const LAST = ["Nair", "Rao", "Khan", "Iyer", "Shah", "Gupta", "Menon", "Das", "Patel", "Reddy"];
const COLLEGES = [
  "Anna University",
  "VIT Vellore",
  "BITS Pilani",
  "PSG College of Technology",
  "RV College of Engineering",
  "SRM Institute of Science and Technology",
];
const SKILLS = [
  "React",
  "Python",
  "Machine Learning",
  "UI/UX",
  "Node.js",
  "Flutter",
  "TypeScript",
  "Figma",
  "Docker",
  "Go",
  "Blockchain",
  "Cybersecurity",
  "Data Analysis",
  "Java",
  "Rust",
];
const INTERESTS = ["Hackathons", "Startups", "Open source", "AI/ML", "UI/UX", "Robotics"];

/** Sixty made-up students. The same ones every time, so the mock feels stable. */
export const mockPeople: MockPerson[] = Array.from({ length: 60 }, (_, i) => ({
  id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  name: `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`,
  college: COLLEGES[i % COLLEGES.length],
  skills: [
    SKILLS[i % SKILLS.length],
    SKILLS[(i * 3 + 1) % SKILLS.length],
    SKILLS[(i * 5 + 2) % SKILLS.length],
  ],
  interests: [INTERESTS[i % INTERESTS.length], INTERESTS[(i + 2) % INTERESTS.length]],
}));
