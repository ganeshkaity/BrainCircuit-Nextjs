"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserReports, getQuizSets } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Calendar, FileQuestion, Eye, X, CheckCircle2, Check, XCircle, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { QuestionReport, QuizSet } from "@/types";
import { cn } from "@/lib/helpers";
import Header from "@/components/layout/Header";

export default function MyReportsPage() {
  const { user } = useUserStore();
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);

  const { data: reports = [], isLoading: isLoadingReports } = useQuery<QuestionReport[]>({
    queryKey: ["user_reports", user?.uid],
    queryFn: () => (user?.uid ? getUserReports(user.uid) : Promise.resolve([])) as any,
    enabled: !!user?.uid,
  });

  const { data: quizzes = [] } = useQuery<QuizSet[]>({
    queryKey: ["quizzes"],
    queryFn: () => getQuizSets(),
  });

  const selectedQuestion = selectedReport ? (() => {
    const quiz = quizzes.find(q => q.id === selectedReport.quizId);
    return quiz?.questions.find(q => q.id === selectedReport.questionId);
  })() : null;

  return (
    <div className="min-h-screen pb-20">
      <Header title="My Reports" showBack />

      <main className="max-w-4xl mx-auto p-4 md:p-8 pt-36 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400">
            <Flag size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">My Reports</h1>
            <p className="text-gray-400 text-sm">Track the status of errors you've reported.</p>
          </div>
        </div>

        {isLoadingReports ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 glass-md border border-white/10 rounded-3xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-500">
              <Flag size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No reports yet</h3>
              <p className="text-gray-400 text-sm">When you report a question error during a quiz, it will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report, i) => {
              const date = new Date(report.createdAt);
              const quizName = quizzes.find((q: QuizSet) => q.id === report.quizId)?.title || "Unknown Quiz";

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "glass-md border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group",
                    report.status === 'edited' && "border-green-500/30 bg-green-500/5",
                    report.status === 'rejected' && "border-red-500/30 bg-red-500/5"
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-white/10 text-gray-300 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                          {report.reason}
                        </span>
                        {report.status === 'pending' ? (
                          <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                            <Clock size={10} /> Pending
                          </span>
                        ) : report.status === 'edited' ? (
                          <span className="flex items-center gap-1 bg-green-500/20 text-green-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                            <Check size={10} /> Edited (Fixed)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-red-500/20 text-red-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                            <XCircle size={10} /> Rejected
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                          <FileQuestion size={10} className="text-purple-400" /> {quizName}
                        </p>
                        <p className="text-white text-sm font-medium leading-relaxed italic">
                          "{report.reason}"
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-600" /> {date.toLocaleDateString()}
                        </span>
                        <span>ID: {report.questionId.slice(0, 8)}...</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="w-full md:w-auto px-4 py-2 rounded-xl bg-purple-600/10 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/20 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                      >
                        <Eye size={16} /> View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-gray-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl glass-dark border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85dvh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                     <FileQuestion size={20} />
                   </div>
                   <div>
                     <h2 className="text-lg font-bold text-white leading-none">Reported Question</h2>
                     <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">Question ID: {selectedReport.questionId}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {selectedQuestion ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Question</h3>
                         <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase">{selectedQuestion.type}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-white text-sm leading-relaxed">
                        {selectedQuestion.text}
                      </div>
                      {selectedQuestion.imageUrl && (
                        <img src={selectedQuestion.imageUrl} alt="Question" className="rounded-xl border border-white/10 max-h-48 object-contain bg-black/20 w-full" />
                      )}
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em]">Resolution</h3>
                         {selectedReport.status === 'edited' ? (
                           <span className="text-[10px] font-black text-green-500 flex items-center gap-1 uppercase tracking-widest"><Check size={12}/> Admin Fixed This</span>
                         ) : selectedReport.status === 'rejected' ? (
                           <span className="text-[10px] font-black text-red-500 flex items-center gap-1 uppercase tracking-widest"><XCircle size={12}/> Report Rejected</span>
                         ) : (
                           <span className="text-[10px] font-black text-yellow-500 flex items-center gap-1 uppercase tracking-widest"><Clock size={12}/> Under Review</span>
                         )}
                       </div>
                       
                       {selectedReport.status === 'edited' ? (
                         <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 text-gray-300 text-sm leading-relaxed flex items-start gap-3">
                           <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                           <p>The issue you reported has been verified and fixed. Thank you for helping us improve BrainCircuit!</p>
                         </div>
                       ) : selectedReport.status === 'rejected' ? (
                         <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-gray-300 text-sm leading-relaxed flex items-start gap-3">
                           <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                           <p>Our team reviewed this question and found it to be correct as per the standard syllabus. If you still have doubts, please check the explanation.</p>
                         </div>
                       ) : (
                         <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm leading-relaxed flex items-start gap-3 italic">
                           <Clock size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                           <p>Our subject matter experts are currently reviewing your feedback. We'll update the status here once verified.</p>
                         </div>
                       )}
                    </div>

                    {selectedQuestion.explanation && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Correct Explanation</h3>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-gray-300 text-xs leading-relaxed">
                          {selectedQuestion.explanation}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
                    <p className="text-gray-400">Question data could not be loaded.</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-white/5">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-colors shadow-glow-purple"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
