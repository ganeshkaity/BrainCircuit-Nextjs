import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Question, PaletteStatus } from "@/types";

interface QuizState {
  quizId: string | null;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, number[]>;
  visited: string[];
  marked: string[];
  startedAt: number | null; // epoch ms
  remainingSeconds: number;
  questionTimes: Record<string, number>;
  isSubmitted: boolean;

  // Actions
  initQuiz: (params: {
    quizId: string;
    questions: Question[];
    durationMinutes: number;
  }) => void;
  setAnswer: (questionId: string, options: number[]) => void;
  toggleMark: (questionId: string) => void;
  visitQuestion: (questionId: string) => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  tickTimer: () => void;
  submitQuiz: () => void;
  clearQuiz: () => void;
  getPaletteStatus: (questionId: string) => PaletteStatus;
  getAnsweredCount: () => number;
  getMarkedCount: () => number;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizId: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      visited: [],
      marked: [],
      startedAt: null,
      remainingSeconds: 0,
      questionTimes: {},
      isSubmitted: false,

      initQuiz: ({ quizId, questions, durationMinutes }) => {
        const state = get();
        // Resume if same quiz already in progress
        if (state.quizId === quizId && !state.isSubmitted && state.startedAt) {
          return;
        }
        set({
          quizId,
          questions,
          currentIndex: 0,
          answers: {},
          visited: questions[0] ? [questions[0].id] : [],
          marked: [],
          startedAt: Date.now(),
          remainingSeconds: durationMinutes * 60,
          questionTimes: {},
          isSubmitted: false,
        });
      },

      setAnswer: (questionId, options) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: options } })),

      toggleMark: (questionId) =>
        set((s) => {
          const marked = s.marked.includes(questionId)
            ? s.marked.filter(id => id !== questionId)
            : [...s.marked, questionId];
          return { marked };
        }),

      visitQuestion: (questionId) =>
        set((s) => {
          if (s.visited.includes(questionId)) return s;
          return { visited: [...s.visited, questionId] };
        }),

      goTo: (index) => {
        const { questions } = get();
        if (index < 0 || index >= questions.length) return;
        const qId = questions[index].id;
        set((s) => {
          const visited = s.visited.includes(qId) ? s.visited : [...s.visited, qId];
          return { currentIndex: index, visited };
        });
      },

      next: () => {
        const { currentIndex, questions } = get();
        if (currentIndex < questions.length - 1) get().goTo(currentIndex + 1);
      },

      prev: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) get().goTo(currentIndex - 1);
      },

      tickTimer: () =>
        set((s) => {
          const currentQId = s.questions[s.currentIndex]?.id;
          if (!currentQId) return { remainingSeconds: Math.max(0, s.remainingSeconds - 1) };
          
          return {
            remainingSeconds: Math.max(0, s.remainingSeconds - 1),
            questionTimes: {
              ...s.questionTimes,
              [currentQId]: (s.questionTimes[currentQId] || 0) + 1
            }
          };
        }),

      submitQuiz: () => set({ isSubmitted: true }),

      clearQuiz: () =>
        set({
          quizId: null,
          questions: [],
          currentIndex: 0,
          answers: {},
          visited: [],
          marked: [],
          startedAt: null,
          remainingSeconds: 0,
          questionTimes: {},
          isSubmitted: false,
        }),

      getPaletteStatus: (questionId): PaletteStatus => {
        const { answers, visited, marked } = get();
        const isAnswered = (answers[questionId]?.length ?? 0) > 0;
        const isVisited = visited.includes(questionId);
        const isMarked = marked.includes(questionId);
        if (isMarked && isAnswered) return "marked-answered";
        if (isMarked) return "marked";
        if (isAnswered) return "answered";
        if (isVisited) return "skipped";
        return "unattempted";
      },

      getAnsweredCount: () => {
        const { answers } = get();
        return Object.values(answers).filter((v) => v.length > 0).length;
      },

      getMarkedCount: () => get().marked.length,
    }),
    {
      name: "brain-circuit-quiz",
    }
  )
);
