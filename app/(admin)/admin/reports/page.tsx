"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQuestionReports, getQuizSets, updateReportStatus } from "@/lib/firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ExternalLink, Calendar, User, Search, FileQuestion, Eye, X, CheckCircle2, Check, XCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { QuestionReport, QuizSet } from "@/types";
import { cn } from "@/lib/helpers";

export default function AdminReportsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);

  const { data: reports = [], isLoading: isLoadingReports } = useQuery<QuestionReport[]>({
    queryKey: ["admin_reports"],
    queryFn: () => getQuestionReports() as any,
  });

  const handleStatusUpdate = async (reportId: string, status: "edited" | "rejected") => {
    try {
      await updateReportStatus(reportId, status);
      queryClient.invalidateQueries({ queryKey: ["admin_reports"] });
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const { data: quizzes = [] } = useQuery<QuizSet[]>({
    queryKey: ["quizzes"],
    queryFn: () => getQuizSets(),
  });

  const filteredReports = reports.filter(r => {
    const s = search.toLowerCase();
    return (
      (r.reason?.toLowerCase() || "").includes(s) || 
      (r.quizId?.toLowerCase() || "").includes(s) ||
      (r.questionId?.toLowerCase() || "").includes(s) ||
      (r.status?.toLowerCase() || "").includes(s)
    );
  });

  const selectedQuestion = selectedReport ? (() => {
    const quiz = quizzes.find(q => q.id === selectedReport.quizId);
    return quiz?.questions.find(q => q.id === selectedReport.questionId);
  })() : null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <AlertTriangle className="text-red-500" /> Question Reports
          </h1>
          <p className="text-gray-400 text-sm mt-1">Review feedback and corrections submitted by students.</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reason, quiz ID, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Reports List */}
      {isLoadingReports ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-gray-400">No reports found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((report, i) => {
            const date = new Date(report.createdAt);
            const quizName = quizzes.find((q: QuizSet) => q.id === report.quizId)?.title || "Unknown Quiz";

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors relative overflow-hidden",
                  report.status === 'edited' && "border-green-500/30 bg-green-500/5",
                  report.status === 'rejected' && "border-red-500/30 bg-red-500/5"
                )}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2.5 py-1 rounded-md">
                        {report.reason}
                      </span>
                      {report.status === 'pending' ? (
                        <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                          <Clock size={10} /> Pending
                        </span>
                      ) : report.status === 'edited' ? (
                        <span className="flex items-center gap-1 bg-green-500/20 text-green-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                          <Check size={10} /> Edited
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-red-500/20 text-red-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                          <XCircle size={10} /> Rejected
                        </span>
                      )}
                    </div>
                    
                    <p className="text-white text-sm font-medium leading-relaxed">
                      " {report.reason} "
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded">
                        <FileQuestion size={14} className="text-purple-400" /> Quiz: {quizName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User size={14} className="text-blue-400" /> User: {report.userId === "anonymous" ? "Guest" : report.userId.slice(0, 8) + "..."}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-green-400" /> {date.toLocaleDateString()} {date.toLocaleTimeString()}
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-500">
                        ID: {report.questionId}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-wrap items-center gap-2 justify-end">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(report.id, "edited")}
                          className="px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-500/30 transition-colors flex items-center gap-1.5 text-xs font-bold"
                        >
                          <Check size={14} /> Edited
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(report.id, "rejected")}
                          className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 transition-colors flex items-center gap-1.5 text-xs font-bold"
                        >
                          <XCircle size={14} /> Rejected
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Eye size={14} /> Details
                    </button>
                    <button
                      onClick={() => router.push(`/admin/quizzes/${report.quizId}`)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 hover:text-white border border-purple-500/30 transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                      <ExternalLink size={14} /> Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl glass-md border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[90dvh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white">Question Details</h2>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">ID: {selectedReport.questionId}</p>
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
                      <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">Question Text</h3>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-white leading-relaxed">
                        {selectedQuestion.text}
                      </div>
                      {selectedQuestion.imageUrl && (
                        <img src={selectedQuestion.imageUrl} alt="Question" className="rounded-xl border border-white/10 max-h-64 object-contain bg-black/20 w-full" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Question Type</p>
                        <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">{selectedQuestion.type}</p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Correct Ans</p>
                        <p className="text-xs font-black text-green-400 uppercase tracking-wider">
                          {selectedQuestion.type === 'integer' 
                            ? selectedQuestion.correctOptions[0] 
                            : selectedQuestion.correctOptions.map(idx => String.fromCharCode(65 + idx)).join(", ")}
                        </p>
                      </div>
                    </div>

                    {selectedQuestion.type !== 'integer' && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Options</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedQuestion.options.map((opt, idx) => {
                            const isCorrect = selectedQuestion.correctOptions.includes(idx);
                            return (
                              <div 
                                key={idx}
                                className={cn(
                                  "p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors",
                                  isCorrect 
                                    ? "bg-green-500/10 border-green-500/50 text-green-200" 
                                    : "bg-white/5 border-white/10 text-gray-300"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span className="text-sm">{opt}</span>
                                </div>
                                {isCorrect && <CheckCircle2 size={18} className="text-green-500 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedQuestion.explanation && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider">Explanation</h3>
                        <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 text-gray-300 text-sm leading-relaxed">
                          {selectedQuestion.explanation}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
                    <p className="text-gray-400">Question data could not be loaded. It may have been deleted or the ID is incorrect.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-white/5 flex gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    router.push(`/admin/quizzes/${selectedReport.quizId}`);
                    setSelectedReport(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-colors shadow-glow-purple"
                >
                  Go to Editor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
