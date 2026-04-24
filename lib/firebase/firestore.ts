import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./config";
import type { UserProfile, QuizSet, Question, Attempt, OnboardingOptions } from "@/types";

// ──────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────
export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUser(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, "users", uid), {
    ...data,
    uid,
    points: 0,
    level: "Rookie",
    createdAt: serverTimestamp(),
  });
}

export async function updateUser(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, "users", uid), data);
}

// ──────────────────────────────────────────────
// QUIZ SETS
// ──────────────────────────────────────────────
export async function getQuizSets(params?: {
  exam?: string;
  language?: string;
  classLevel?: string;
}): Promise<QuizSet[]> {
  let q = query(collection(db, "quiz_sets"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let sets = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizSet));

  // client-side filter for multi-criteria (avoids composite index requirement for MVP)
  if (params?.exam) sets = sets.filter((s) => s.exam === params.exam);
  if (params?.language)
    sets = sets.filter((s) => s.language === params.language);
  if (params?.classLevel)
    sets = sets.filter((s) => s.classLevel === params.classLevel);

  return sets;
}

export async function getQuizSet(id: string): Promise<QuizSet | null> {
  const snap = await getDoc(doc(db, "quiz_sets", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as QuizSet) : null;
}

/** Recursively remove keys with undefined values (Firestore rejects them) */
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

export async function createQuizSet(data: Omit<QuizSet, "id" | "createdAt">) {
  return addDoc(collection(db, "quiz_sets"), {
    ...sanitizeForFirestore(data),
    createdAt: serverTimestamp(),
  });
}

export async function updateQuizSet(id: string, data: Partial<QuizSet>) {
  return updateDoc(doc(db, "quiz_sets", id), sanitizeForFirestore(data));
}

export async function deleteQuizSet(id: string) {
  return deleteDoc(doc(db, "quiz_sets", id));
}

// ──────────────────────────────────────────────
// ATTEMPTS
// ──────────────────────────────────────────────
export async function saveAttempt(attempt: Omit<Attempt, "id" | "createdAt">) {
  return addDoc(collection(db, "attempts"), {
    ...attempt,
    createdAt: Timestamp.now(),
  });
}

export async function getAttempt(id: string): Promise<Attempt | null> {
  const snap = await getDoc(doc(db, "attempts", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Attempt) : null;
}

export async function getUserAttempts(uid: string): Promise<Attempt[]> {
  const q = query(
    collection(db, "attempts"),
    where("uid", "==", uid),
    limit(50)
  );
  const snap = await getDocs(q);
  const attempts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt));
  // Sort client-side to avoid needing a Firestore composite index
  return attempts.sort((a, b) => {
    const tA = a.createdAt && "toMillis" in a.createdAt ? (a.createdAt as any).toMillis() : (a.createdAt as any)?.seconds * 1000 || 0;
    const tB = b.createdAt && "toMillis" in b.createdAt ? (b.createdAt as any).toMillis() : (b.createdAt as any)?.seconds * 1000 || 0;
    return tB - tA;
  });
}

export async function getLeaderboard(exam: string, limitN = 50) {
  const q = query(
    collection(db, "users"),
    where("targetExam", "==", exam),
    limit(limitN)
  );
  const snap = await getDocs(q);
  const users = snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as UserProfile));
  // Sort client-side to avoid composite index requirement
  return users.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
}

// ──────────────────────────────────────────────
// RANKING
// ──────────────────────────────────────────────
export async function calculateRank(params: {
  quizId: string;
  score: number;
  timeTaken: number;
}): Promise<number> {
  const q = query(
    collection(db, "attempts"),
    where("quizId", "==", params.quizId)
  );
  const snap = await getDocs(q);
  const attempts = snap.docs.map((d) => d.data() as Attempt);
  const better = attempts.filter(
    (a) =>
      a.score > params.score ||
      (a.score === params.score && a.timeTaken < params.timeTaken)
  );
  return better.length + 1;
}

// ──────────────────────────────────────────────
// APP CONFIG / OPTIONS
// ──────────────────────────────────────────────
export async function getOnboardingOptions(): Promise<OnboardingOptions> {
  const defaults: OnboardingOptions = {
    exams: ["NEET", "JEE Mains", "JEE Advanced"],
    languages: ["English", "Hindi"],
    classes: ["11", "12", "Dropper"],
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "G.K"],
    badges: [
      { label: "Hot !", color: "from-orange-500 to-red-500" },
      { label: "New",  color: "from-blue-500 to-cyan-400" },
      { label: "Easy", color: "from-green-500 to-emerald-400" },
      { label: "Hard", color: "from-red-600 to-pink-500" },
      { label: "Popular", color: "from-purple-500 to-violet-400" },
    ],
  };
  const snap = await getDoc(doc(db, "app_config", "onboarding_options"));
  if (snap.exists()) {
    // Merge with defaults so any newly added fields are always present
    return { ...defaults, ...snap.data() } as OnboardingOptions;
  }
  return defaults;
}

export async function updateOnboardingOptions(data: OnboardingOptions) {
  await setDoc(doc(db, "app_config", "onboarding_options"), data);
}

// ──────────────────────────────────────────────
// QUESTION REPORTS
// ──────────────────────────────────────────────
export async function reportQuestion(data: {
  quizId: string;
  questionId: string;
  userId: string;
  reason: string;
  createdAt: number;
}) {
  const reportsRef = collection(db, "question_reports");
  await addDoc(reportsRef, { ...data, status: "pending" });
}

export async function updateReportStatus(reportId: string, status: "edited" | "rejected") {
  await updateDoc(doc(db, "question_reports", reportId), { status });
}

export async function getQuestionReports() {
  const reportsRef = collection(db, "question_reports");
  const q = query(reportsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUserReports(userId: string) {
  const reportsRef = collection(db, "question_reports");
  const q = query(reportsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
}
