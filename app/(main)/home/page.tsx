"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQuizSets, getOnboardingOptions, getUserAttempts } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import QuizCard from "@/components/cards/QuizCard";
import GradientButton from "@/components/ui/GradientButton";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, BookOpen, Tag, ChevronDown, Filter, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/helpers";
import LoadingState from "@/components/ui/LoadingState";

function QuizSkeleton() {
  return (
    <div className="animate-pulse flex flex-col h-full bg-white/5 border border-white/10 rounded-3xl p-8 min-h-[240px] relative overflow-hidden">
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <div className="h-5 w-14 bg-white/10 rounded-md" />
          <div className="h-5 w-14 bg-white/10 rounded-md" />
        </div>
        <div className="h-6 w-16 bg-white/10 rounded-md ml-auto" />
      </div>
      <div className="h-8 w-3/4 bg-white/10 rounded-lg mb-4" />
      <div className="space-y-2 mb-8">
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-3 w-2/3 bg-white/5 rounded" />
      </div>
      <div className="mt-auto pt-6 border-t border-white/10 flex justify-between gap-3">
        <div className="h-10 flex-1 bg-white/5 rounded-xl" />
        <div className="h-10 flex-1 bg-white/5 rounded-xl" />
        <div className="h-10 flex-1 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, firebaseUid } = useUserStore();
  const [filterExam, setFilterExam] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data: attempts = [] } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => (firebaseUid ? getUserAttempts(firebaseUid) : Promise.resolve([])) as any,
    enabled: !!firebaseUid,
  });

  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => getQuizSets() as any,
  });

  const { data: options } = useQuery({
    queryKey: ["onboarding-options"],
    queryFn: getOnboardingOptions,
  });

  const isLoading = isLoadingQuizzes || !options;

  const perfectQuizIds = useMemo(() => {
    const set = new Set<string>();
    attempts.forEach((a: any) => {
      const q = quizzes.find((quiz: any) => quiz.id === a.quizId);
      if (q && a.score === q.totalMarks) {
        set.add(a.quizId);
      }
    });
    return set;
  }, [attempts, quizzes]);

  const filtered = useMemo(() => {
    return quizzes.filter((q: any) => {
      // Hide unpublished quizzes for students
      if (q.isPublished === false) return false;

      const matchExam = !filterExam || (Array.isArray(q.exam) ? q.exam.includes(filterExam) : q.exam === filterExam);
      const matchSubject = !filterSubject || (q.subjects && q.subjects.includes(filterSubject));
      const matchLanguage = !filterLanguage || q.language === filterLanguage;
      const matchTag = !filterTag || (q.badge && (typeof q.badge === 'string' ? q.badge === filterTag : q.badge.label === filterTag));
      const matchSearch =
        !searchQuery ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCompleted = showCompletedOnly || !perfectQuizIds.has(q.id);

      return matchExam && matchSubject && matchLanguage && matchTag && matchSearch && matchCompleted;
    });
  }, [quizzes, filterExam, filterSubject, filterLanguage, filterTag, searchQuery, showCompletedOnly, perfectQuizIds]);

  // Initialize filter based on personal recommendations
  useEffect(() => {
    if (user?.personalRecommendations && user?.targetExam && !filterExam) {
      setFilterExam(user.targetExam);
    }
  }, [user]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (searchQuery) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Only auto-load if we're not already loading and the button is potentially scrolled past
        if (entries[0].isIntersecting && visibleCount < filtered.length && !isAutoLoading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount, searchQuery, isAutoLoading]);

  const handleLoadMore = () => {
    if (isAutoLoading || visibleCount >= filtered.length) return;
    setIsAutoLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 10, filtered.length));
      setIsAutoLoading(false);
    }, 800);
  };

  const displayQuizzes = useMemo(() => {
    if (searchQuery) return filtered;
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount, searchQuery]);

  return (
    <main className="min-h-dvh pb-24 pt-16">
      <Header onSearch={setSearchQuery} />

      <div className="px-5 max-w-7xl mx-auto mt-4">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {user ? (
            <>
              <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
                Hello, <span className="text-purple-400">{user.displayName?.split(" ")[0] || "Student"}</span>!
              </h1>
              <p className="text-gray-400 text-sm font-medium">Find your next challenge and excel.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
                Welcome to <span className="text-purple-400">Brain Circuit</span>!
              </h1>
              <p className="text-gray-400 text-sm font-medium">Please log in to start practicing quizzes.</p>
            </>
          )}
        </motion.div>

        {/* Filter Section Label */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-3 px-1 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-purple-500 rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
              Filter Options :
            </h2>
          </div>

          <label className="flex items-center gap-2 cursor-pointer group">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest transition-colors",
              showCompletedOnly ? "text-purple-400" : "text-gray-500 group-hover:text-gray-300"
            )}>
              {showCompletedOnly ? "Showing All" : "Hide Completed"}
            </span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={showCompletedOnly}
                onChange={(e) => setShowCompletedOnly(e.target.checked)}
              />
              <div className={cn(
                "w-8 h-4 rounded-full transition-all duration-300",
                showCompletedOnly ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]" : "bg-white/10"
              )} />
              <div className={cn(
                "absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm",
                showCompletedOnly ? "translate-x-4" : "translate-x-0"
              )} />
            </div>
          </label>
        </motion.div>

        {/* New Dropdown Filter Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md relative z-50"
        >
          {/* Language Filter */}
          <FilterDropdown 
            label="Language" 
            icon={<Globe size={16} />} 
            value={filterLanguage} 
            options={options?.languages || []} 
            onChange={setFilterLanguage} 
          />

          {/* Exam Filter */}
          <FilterDropdown 
            label="Exam" 
            icon={<BookOpen size={16} />} 
            value={filterExam} 
            options={options?.exams || []} 
            onChange={setFilterExam} 
          />

          {/* Subject Filter */}
          <FilterDropdown 
            label="Subject" 
            icon={<LayoutGrid size={16} />} 
            value={filterSubject} 
            options={options?.subjects || []} 
            onChange={setFilterSubject} 
          />

          {/* Tag Filter */}
          <FilterDropdown 
            label="Tags" 
            icon={<Tag size={16} />} 
            value={filterTag} 
            options={options?.badges.map(b => b.label) || []} 
            onChange={setFilterTag} 
          />
        </motion.div>

        {/* Results Info */}
        <AnimatePresence>
          {(filterExam || filterSubject || filterLanguage || filterTag || searchQuery) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between mb-6 px-1"
            >
              <p className="text-xs text-gray-500 font-black uppercase tracking-widest">
                Showing {filtered.length} {filtered.length === 1 ? "Result" : "Results"}
              </p>
              <button 
                onClick={() => {
                  setFilterExam("");
                  setFilterSubject("");
                  setFilterLanguage("");
                  setFilterTag("");
                  setSearchQuery("");
                }}
                className="text-[10px] text-purple-400 font-black uppercase tracking-widest hover:text-purple-300 transition-colors"
              >
                Clear All
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quiz Grid */}
        {isLoading ? (
          <LoadingState message="Preparing your dashboard..." />
        ) : filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayQuizzes.map((quiz: any, i: number) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (i % 20) * 0.05 }}
                >
                  <QuizCard 
                    quiz={quiz} 
                    attempts={attempts.filter((a: any) => a.quizId === quiz.id)}
                  />
                </motion.div>
              ))}

              {/* Skeletons to fill empty spots when auto-loading */}
              {isAutoLoading && [...Array(3)].map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <QuizSkeleton />
                </motion.div>
              ))}
            </div>

            {/* Manual Load More Button */}
            {!searchQuery && visibleCount < filtered.length && !isAutoLoading && (
              <div className="mt-12 flex justify-center">
                <GradientButton 
                  onClick={handleLoadMore}
                  className="px-10"
                >
                  Load More Tests
                </GradientButton>
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            {!searchQuery && visibleCount < filtered.length && (
              <div ref={loaderRef} className="h-20" />
            )}

            {/* End of list message */}
            {!searchQuery && visibleCount >= filtered.length && filtered.length > 0 && (
              <div className="py-20 text-center">
                <p className="text-gray-500 text-sm font-medium">You've reached the end of the collection.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 glass-dark rounded-[2.5rem] border border-white/5">
            <Filter size={48} className="mx-auto mb-4 text-gray-700" />
            <h3 className="text-xl font-bold text-white mb-2">No Quizzes Found</h3>
            <p className="text-gray-500 max-w-xs mx-auto text-sm">We couldn&apos;t find any quizzes matching your current filters. Try adjusting them!</p>
          </div>
        )}
      </div>
    </main>
  );
}

function FilterDropdown({ label, icon, value, options, onChange }: { 
  label: string, 
  icon: React.ReactNode, 
  value: string, 
  options: string[], 
  onChange: (val: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border transition-all text-left",
          value 
            ? "bg-purple-600/20 border-purple-500/50 text-white" 
            : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("p-1.5 rounded-lg shrink-0", value ? "bg-purple-500/20" : "bg-white/5")}>
            {icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 leading-none mb-0.5">{label}</span>
            <span className="text-xs font-bold truncate">{value || "All"}</span>
          </div>
        </div>
        <ChevronDown size={14} className={cn("shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ 
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 50px rgba(0,0,0,0.5)"
              }}
              className="absolute top-full left-0 right-0 mt-2 z-[90] border border-white/5 rounded-[1.5rem] overflow-hidden backdrop-blur-[40px] saturate-[180%]"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => { onChange(""); setIsOpen(false); }}
                  className={cn(
                    "w-full px-4 py-3 text-xs font-bold text-left hover:bg-white/5 transition-colors border-b border-white/5",
                    value === "" ? "text-purple-400 bg-purple-400/5" : "text-gray-400"
                  )}
                >
                  All {label}s
                </button>
                {options.map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => { onChange(opt); setIsOpen(false); }}
                    className={cn(
                      "w-full px-4 py-3 text-xs font-bold text-left hover:bg-white/5 transition-colors",
                      value === opt ? "text-purple-400 bg-purple-400/5" : "text-gray-300"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
