"use client";

import { useState, useMemo } from "react";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { getUserAttempts, getQuizSets } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import { CheckCircle, Clock, Search, Filter, CalendarDays, BookOpen, Target, ChevronDown } from "lucide-react";
import { formatTime, cn } from "@/lib/helpers";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/ui/LoadingState";
import GradientButton from "@/components/ui/GradientButton";

export default function RecentTestsPage() {
  const { firebaseUid } = useUserStore();
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [examFilter, setExamFilter] = useState("All");
  const [marksFilter, setMarksFilter] = useState("All");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  // Queries
  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => getUserAttempts(firebaseUid!),
    enabled: !!firebaseUid,
    staleTime: 0,
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => getQuizSets(),
  });

  const isLoading = attemptsLoading || quizzesLoading;

  // Process data: Combine attempt with its quiz details
  const enrichedAttempts = useMemo(() => {
    return attempts.map(attempt => {
      const quiz = quizzes.find(q => q.id === attempt.quizId);
      return {
        ...attempt,
        quiz,
        percentage: attempt.percentage ?? parseFloat(((attempt.score / attempt.maxScore) * 100).toFixed(1)),
      };
    });
  }, [attempts, quizzes]);

  // Extract unique subjects and exams for filters
  const uniqueSubjects = useMemo(() => {
    const subs = new Set<string>();
    enrichedAttempts.forEach(a => a.quiz?.subjects?.forEach(s => subs.add(s)));
    return ["All", ...Array.from(subs)];
  }, [enrichedAttempts]);

  const uniqueExams = useMemo(() => {
    const exams = new Set<string>();
    enrichedAttempts.forEach(a => { 
      if (a.quiz?.exam) {
        if (Array.isArray(a.quiz.exam)) {
          a.quiz.exam.forEach(e => exams.add(e));
        } else {
          exams.add(a.quiz.exam);
        }
      } 
    });
    return ["All", ...Array.from(exams)];
  }, [enrichedAttempts]);

  // Apply filters
  const filteredAttempts = useMemo(() => {
    return enrichedAttempts.filter(a => {
      // 1. Search (Title)
      if (search && !a.quiz?.title.toLowerCase().includes(search.toLowerCase())) return false;
      
      // 2. Subject Filter
      if (subjectFilter !== "All" && !a.quiz?.subjects.includes(subjectFilter)) return false;
      
      // 3. Exam Filter
      if (examFilter !== "All") {
        if (Array.isArray(a.quiz?.exam)) {
          if (!a.quiz.exam.includes(examFilter)) return false;
        } else {
          if (a.quiz?.exam !== examFilter) return false;
        }
      }
      
      // 4. Marks Filter
      if (marksFilter !== "All") {
        if (marksFilter === ">90%" && a.percentage < 90) return false;
        if (marksFilter === ">80%" && a.percentage < 80) return false;
        if (marksFilter === ">50%" && a.percentage < 50) return false;
        if (marksFilter === "<50%" && a.percentage >= 50) return false;
      }
      
      return true;
    });
  }, [enrichedAttempts, search, subjectFilter, examFilter, marksFilter]);

  return (
    <main className="min-h-dvh pb-24 pt-16">
      <Header title="All Recent Tests" showBack onBack={() => router.back()} />
      
      <div className="px-5 max-w-xl mx-auto mt-6">
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search tests by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="absolute inset-y-2 right-2 px-3 flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <Filter size={14} className="text-purple-400" />
            <span className="text-xs font-bold text-white">Filters</span>
          </button>
        </div>

        {/* Expandable Filters Area */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-md rounded-2xl p-4 grid grid-cols-2 gap-3 border border-white/5">
                
                {/* Subject Filter */}
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <BookOpen size={10} /> Subject
                  </label>
                  <div className="relative">
                    <select 
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-sm text-white appearance-none focus:outline-none"
                    >
                      {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Exam Filter */}
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Target size={10} /> Exam
                  </label>
                  <div className="relative">
                    <select 
                      value={examFilter}
                      onChange={(e) => setExamFilter(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-sm text-white appearance-none focus:outline-none"
                    >
                      {uniqueExams.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Marks Filter */}
                <div className="col-span-2">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CheckCircle size={10} /> Marks / Percentage
                  </label>
                  <div className="relative">
                    <select 
                      value={marksFilter}
                      onChange={(e) => setMarksFilter(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-3 pr-8 text-sm text-white appearance-none focus:outline-none"
                    >
                      <option value="All">All Scores</option>
                      <option value=">90%">Exceptional ( \u003e 90% )</option>
                      <option value=">80%">Excellent ( \u003e 80% )</option>
                      <option value=">50%">Passed ( \u003e 50% )</option>
                      <option value="<50%">Needs Improvement ( \u003c 50% )</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results List */}
        <div className="space-y-4">
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
              {filteredAttempts.length} Tests Found
            </h2>
          </div>

          {isLoading ? (
            <LoadingState message="Fetching your test history..." />
          ) : filteredAttempts.length > 0 ? (
            <>
              {filteredAttempts.slice(0, visibleCount).map((a, i) => {
                const pct = a.percentage;
                let scoreColor = "text-red-400";
                let ringColor = "hover:border-red-500/30";
                if (pct === 100) { scoreColor = "text-yellow-400"; ringColor = "hover:border-yellow-500/50 ring-1 ring-yellow-500/20"; }
                else if (pct >= 80) { scoreColor = "text-green-400"; ringColor = "hover:border-green-500/40"; }
                else if (pct >= 50) { scoreColor = "text-orange-400"; ringColor = "hover:border-orange-500/40"; }

                return (
                  <motion.div 
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 10) * 0.05 }}
                    onClick={() => router.push(`/quiz/${a.quizId}/result?attemptId=${a.id}`)}
                    className={cn(
                      "glass-md rounded-2xl p-4 border border-white/5 cursor-pointer transition-all active:scale-[0.98] group",
                      ringColor
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="pr-4">
                        <h3 className="font-bold text-white text-base leading-tight group-hover:text-purple-300 transition-colors">
                          {a.quiz?.title || "Unknown Quiz"}
                        </h3>
                        <div className="flex gap-2 mt-2">
                          {a.quiz?.exam && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                              {a.quiz.exam}
                            </span>
                          )}
                          {a.quiz?.subjects?.slice(0,2).map(sub => (
                            <span key={sub} className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 uppercase">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className={cn("text-xl font-black", scoreColor)}>
                          {pct}<span className="text-sm opacity-50">%</span>
                        </div>
                        <p className="text-xs font-medium text-gray-400 mt-1">
                          {a.score} / {a.maxScore}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock size={12} className="text-purple-400" /> 
                          {formatTime(a.timeTaken)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Target size={12} className="text-green-400" />
                          +{a.pointsEarned} pts
                        </span>
                      </div>
                      {a.createdAt && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                          <CalendarDays size={10} />
                          {new Date((a.createdAt as any).seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Show More Button */}
              {visibleCount < filteredAttempts.length && (
                <div className="pt-4 flex justify-center">
                  <GradientButton 
                    onClick={() => setVisibleCount(v => v + 10)}
                    className="px-8"
                  >
                    Show More
                  </GradientButton>
                </div>
              )}
            </>
          ) : (
            <div className="glass rounded-2xl p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-300 font-bold mb-1">No tests match your filters</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or clearing filters to see more results.</p>
              {(search || subjectFilter !== "All" || examFilter !== "All" || marksFilter !== "All") && (
                <button 
                  onClick={() => {
                    setSearch("");
                    setSubjectFilter("All");
                    setExamFilter("All");
                    setMarksFilter("All");
                  }}
                  className="mt-6 text-sm font-bold text-purple-400 hover:text-purple-300"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
