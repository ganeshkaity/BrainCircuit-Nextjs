"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getTestGroups, getQuizSets, getUserAttempts } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import QuizCard from "@/components/cards/QuizCard";
import { motion } from "framer-motion";
import LoadingState from "@/components/ui/LoadingState";
import { ChevronLeft } from "lucide-react";
import type { QuizSet, Attempt, TestGroup } from "@/types";

export default function GroupQuizzesPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { firebaseUid } = useUserStore();
  const [visibleCount, setVisibleCount] = useState(10);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = () => {
    if (isManualLoading) return;
    setIsManualLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 10);
      setIsManualLoading(false);
    }, 800);
  };

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

  // Calculate group and quizzes
  const { group, groupQuizzes } = useMemo(() => {
    const foundGroup = (groups as TestGroup[]).find(g => {
      const s = g.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      return s === slug;
    });

    if (!foundGroup) return { group: null, groupQuizzes: [] };

    const quizMap = new Map((quizzes as QuizSet[]).map(q => [q.id, q]));
    const quizzesList = foundGroup.quizIds
      .map(id => quizMap.get(id))
      .filter(Boolean) as QuizSet[];

    return { group: foundGroup, groupQuizzes: quizzesList };
  }, [groups, quizzes, slug]);

  // Intersection Observer for auto-loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isManualLoading && visibleCount < groupQuizzes.length) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [isManualLoading, visibleCount, groupQuizzes.length]);

  const isLoading = loadingGroups || loadingQuizzes || loadingAttempts;

  if (isLoading) {
    return <LoadingState message="Loading collection..." />;
  }

  if (!group) {
    return (
      <main className="min-h-dvh pb-24 pt-16 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Collection Not Found</h1>
        <p className="text-gray-400 mb-6">The collection you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => router.push('/tests')}
          className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-500 transition-colors"
        >
          Back to Tests
        </button>
      </main>
    );
  }


  return (
    <main className="min-h-dvh pb-24 pt-16">
      <Header />

      <div className="px-5 max-w-7xl mx-auto mt-4">
        <div className="mb-8">
           <button 
            onClick={() => router.back()}
            className="flex items-center gap-1 text-purple-400 text-sm font-bold mb-4 hover:text-purple-300 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Collections
          </button>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
              Test <span className="text-purple-400">Collections</span>
            </h1>
            <p className="text-gray-400 text-sm font-black uppercase tracking-widest bg-white/5 inline-block px-3 py-1 rounded-lg border border-white/5 mt-2">
              {group.title}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupQuizzes.slice(0, visibleCount).map((quiz, idx) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <QuizCard
                quiz={quiz}
                attempts={(attempts as Attempt[]).filter((a: Attempt) => a.quizId === quiz.id)}
              />
            </motion.div>
          ))}
          
          {/* Skeleton Loaders */}
          {isManualLoading && Array(3).fill(0).map((_, i) => (
            <div key={`skel-${i}`} className="glass-md rounded-[2.5rem] p-5 h-[160px] animate-pulse border border-white/5">
              <div className="w-2/3 h-6 bg-white/10 rounded-lg mb-3" />
              <div className="w-full h-4 bg-white/5 rounded-lg mb-2" />
              <div className="w-1/2 h-4 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Trigger element for Infinite Scroll */}
        {!isManualLoading && visibleCount < groupQuizzes.length && (
          <div ref={observerRef} className="h-20 w-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Fallback Load More Button (Only if auto-load fails or is delayed) */}
        {!isManualLoading && visibleCount < groupQuizzes.length && (
          <div className="mt-12 flex justify-center opacity-50 hover:opacity-100 transition-opacity">
            <button 
              onClick={handleLoadMore}
              className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-purple-400 transition-colors"
            >
              Click here if it doesn't load automatically
            </button>
          </div>
        )}

        {groupQuizzes.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
            <p className="text-gray-500 font-bold">No quizzes found in this collection.</p>
          </div>
        )}
      </div>
    </main>
  );
}
