// ──────────────────────────────────────────────
// Shared TypeScript types for Brain Circuit
// ──────────────────────────────────────────────

import { Timestamp } from "firebase/firestore";

export type Exam = "NEET" | "JEE Mains" | "JEE Advanced";
export type Language = "English" | "Hindi";
export type ClassLevel = "11" | "12" | "Dropper";
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
  exam: Exam;
  language: Language;
  createdAt?: Timestamp;
}

export interface QuizSet {
  id: string;
  title: string;
  description?: string;
  exam: Exam;
  language: Language;
  classLevel: ClassLevel;
  subjects: string[];
  questions: Question[]; // ALL questions stored inline
  questionCount: number;  // how many to pick randomly per attempt
  totalMarks: number;     // questionCount × marksPerQuestion
  negativeMarks: number;
  durationMinutes: number;
  marksPerQuestion: number;
  createdAt?: Timestamp;
  thumbnailUrl?: string;
}

export interface Attempt {
  id: string;
  uid: string;
  quizId: string;
  answers: Record<string, number[]>; // questionId -> selectedOption indices
  score: number;
  maxScore: number;
  timeTaken: number; // seconds
  rank?: number;
  pointsEarned: number;
  isFirstAttempt: boolean;
  createdAt?: Timestamp;
}
