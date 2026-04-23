import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function calculateScore(params: {
  answers: Record<string, number[]>;
  questions: import("@/types").Question[];
  marksPerQuestion: number;
  negativeMarks: number;
}): number {
  const { answers, questions, marksPerQuestion, negativeMarks } = params;
  let score = 0;
  for (const q of questions) {
    const userAns = answers[q.id] ?? [];
    if (userAns.length === 0) continue;
    const correct = [...q.correctOptions].sort().join(",");
    const user = [...userAns].sort().join(",");
    if (correct === user) {
      score += marksPerQuestion;
    } else {
      score -= negativeMarks;
    }
  }
  return Math.max(0, score);
}

export function getUserLevel(points: number): import("@/types").UserLevel {
  if (points < 100) return "Rookie";
  if (points < 500) return "Scholar";
  if (points < 1500) return "Expert";
  if (points < 3000) return "Master";
  return "Legend";
}

export function getPointsForAttempt(params: {
  score: number;
  maxScore: number;
  isFirstAttempt: boolean;
}): number {
  const { score, maxScore, isFirstAttempt } = params;
  const ratio = score / maxScore;
  const base = Math.round(ratio * 100);
  if (!isFirstAttempt) return Math.round(base / 3);
  return base;
}
