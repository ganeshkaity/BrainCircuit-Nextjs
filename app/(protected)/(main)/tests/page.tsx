"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTestGroups, getQuizSets, getUserAttempts } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import QuizCard from "@/components/cards/QuizCard";
import { motion } from "framer-motion";
import LoadingState from "@/components/ui/LoadingState";
import { Inbox, Trash2 } from "lucide-react";
import type { QuizSet, Attempt, TestGroup } from "@/types";

function DraggableRow({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragged(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    scrollRef.current.scrollLeft = scrollLeft - walk;
    if (Math.abs(walk) > 5) setDragged(true);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged) {
      e.stopPropagation();
      e.preventDefault();
      setDragged(false);
    }
  };

  return (
    <div
      ref={scrollRef}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onClickCapture={onClickCapture}
      className={`flex overflow-x-auto gap-4 pb-4 -mx-5 no-scrollbar ${
        isDragging ? "cursor-grabbing select-none" : "cursor-grab"
      }`}
    >
      <div className="w-3 shrink-0" />
      {children}
      <div className="w-3 shrink-0" />
    </div>
  );
}

export default function TestsPage() {
  const { firebaseUid, user } = useUserStore();

  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ["test-groups"],
    queryFn: getTestGroups,
  });

  const { data: quizzes = [], isLoading: loadingQuizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => getQuizSets() as any,
  });

  const { data: attempts = [], isLoading: loadingAttempts } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => (firebaseUid ? getUserAttempts(firebaseUid) : Promise.resolve([])) as any,
    enabled: !!firebaseUid,
  });

  const isLoading = loadingGroups || loadingQuizzes || loadingAttempts;

  if (isLoading) {
    return <LoadingState message="Loading test collections..." />;
  }

  // Only keep published quizzes
  const publishedQuizzes = quizzes.filter((q: QuizSet) => q.isPublished !== false);
  const quizMap = new Map(publishedQuizzes.map((q: QuizSet) => [q.id, q]));

  const savedQuizzes = user?.savedQuizzes || [];
  const savedGroupQuizzes = publishedQuizzes.filter((q: QuizSet) => savedQuizzes.includes(q.id));

  // Only keep published groups
  const publishedGroups = (groups as TestGroup[]).filter((g) => g.isPublished !== false);

  return (
    <main className="min-h-dvh pb-24 pt-16">
      <Header />

      <div className="px-5 max-w-7xl mx-auto mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
            Test <span className="text-purple-400">Collections</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium">Browse our curated test groups.</p>
        </motion.div>

        <div className="space-y-10">
          {savedGroupQuizzes.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
                <h2 className="text-xl font-bold text-white tracking-wide">Saved Tests</h2>
                <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                  {savedGroupQuizzes.length}
                </span>
              </div>

              <DraggableRow>
                {(savedGroupQuizzes as QuizSet[]).map((quiz: QuizSet) => {
                  const quizAttempts = (attempts as Attempt[]).filter((a: Attempt) => a.quizId === quiz.id);
                  return (
                    <div key={quiz.id} className="w-[280px] md:w-[320px] shrink-0">
                      <QuizCard
                        quiz={quiz}
                        attempts={quizAttempts}
                        compact
                      />
                    </div>
                  );
                })}
              </DraggableRow>
            </motion.section>
          )}

          {publishedGroups.map((group, idx) => {
            const groupQuizzes = group.quizIds
              .map(id => quizMap.get(id))
              .filter(Boolean) as QuizSet[];

            if (groupQuizzes.length === 0) return null;

            return (
              <motion.section 
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                  <h2 className="text-xl font-bold text-white tracking-wide">{group.title}</h2>
                  <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                    {groupQuizzes.length}
                  </span>
                </div>

                {/* Horizontal Scrolling Container */}
                <DraggableRow>
                  {groupQuizzes.map((quiz) => (
                    <div key={quiz.id} className="w-[280px] md:w-[320px] shrink-0">
                      <QuizCard
                        quiz={quiz}
                        attempts={(attempts as Attempt[]).filter((a: Attempt) => a.quizId === quiz.id)}
                      />
                    </div>
                  ))}
                </DraggableRow>
              </motion.section>
            );
          })}

          {publishedGroups.length === 0 && savedGroupQuizzes.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-gray-500 opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No Collections Yet</h3>
              <p className="text-gray-400 text-sm">Check back later for curated test groups.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
