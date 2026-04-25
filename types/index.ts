// ──────────────────────────────────────────────
// Shared TypeScript types for Brain Circuit
// ──────────────────────────────────────────────

import { Timestamp } from "firebase/firestore";

export type Exam = string; // e.g., "NEET" | "JEE Mains" | "JEE Advanced"
export type Language = string; // e.g., "English" | "Hindi"
export type ClassLevel = string; // e.g., "11" | "12" | "Dropper"
export type QuestionType = "single" | "multi" | "integer";
export type PaletteStatus = "unattempted" | "answered" | "skipped" | "marked" | "marked-answered";
export type UserLevel = "Rookie" | "Scholar" | "Expert" | "Master" | "Legend";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  language: Language;
  classLevel: ClassLevel;
  targetExam: Exam;
  dob: string; // ISO
  points: number;
  level: UserLevel;
  isAdmin?: boolean;
  profileComplete: boolean;
  nameUpdatedAt?: string; // ISO string to track 1-month limit
  savedQuizzes?: string[]; // Array of quiz IDs
  personalRecommendations?: boolean;
  createdAt: Timestamp;
}

export interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  options: string[];
  correctOptions: number[]; // 0-indexed
  explanation?: string;
  subject: string;
  chapter: string;
  difficulty: "easy" | "medium" | "hard";
  type: QuestionType;
  exam: Exam | Exam[];
  language: Language;
  createdAt?: Timestamp;
}

export interface QuizBadge {
  label: string;   // e.g. "Hot !", "Hard", "Easy"
  color: string;   // Tailwind gradient or hex, e.g. "from-orange-500 to-red-500"
}

export interface QuizSet {
  id: string;
  title: string;
  description?: string;
  exam: Exam | Exam[];
  language: Language;
  classLevel: ClassLevel;
  subjects: string[];
  questions: Question[]; // ALL questions stored inline
  questionCount: number;  // how many to pick randomly per attempt
  totalMarks: number;     // questionCount × marksPerQuestion
  negativeMarks: number;
  durationMinutes: number;
  marksPerQuestion: number;
  badge?: QuizBadge;      // optional corner ribbon badge
  createdAt?: Timestamp;
  thumbnailUrl?: string;
  isPublished?: boolean;
}

export interface Attempt {
  id: string;
  uid: string;
  quizId: string;
  answers: Record<string, number[]>; // questionId -> selectedOption indices
  questionTimes?: Record<string, number>; // questionId -> time spent in seconds
  questionIds?: string[]; // IDs of questions included in this specific attempt
  questions?: Question[]; // Snapshot of questions (including shuffled options) for this attempt
  score: number;
  maxScore: number;
  percentage?: number; // stored to 3 decimal places e.g. 66.667
  timeTaken: number; // seconds
  rank?: number;
  pointsEarned: number;
  isFirstAttempt: boolean;
  createdAt?: Timestamp;
}

export interface OnboardingOptions {
  exams: string[];
  languages: string[];
  classes: string[];
  subjects: string[];
  badges: QuizBadge[];
}

export interface QuestionReport {
  id: string;
  quizId: string;
  questionId: string;
  userId: string;
  reason: string;
  status: "pending" | "edited" | "rejected";
  createdAt: number;
}

export interface TestGroup {
  id: string;
  title: string;
  quizIds: string[];
  order: number;
  isPublished?: boolean;
  createdAt?: Timestamp;
}
