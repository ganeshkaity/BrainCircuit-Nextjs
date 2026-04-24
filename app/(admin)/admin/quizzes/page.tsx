"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/store/uiStore";
import { getQuizSets, deleteQuizSet } from "@/lib/firebase/firestore";
import Link from "next/link";
import { Edit3, Trash2, Clock, CheckCircle } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";

export default function AdminQuizzesPage() {
  const queryClient = useQueryClient();
  const { showAlert } = useUIStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["admin-quizzes"],
    queryFn: () => getQuizSets(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuizSet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      setDeletingId(null);
    },
    onError: (err) => {
      console.error(err);
      showAlert({ 
        message: "Failed to delete quiz. Please check your connection and try again.", 
        type: "error", 
        title: "Deletion Failed" 
      });
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    showAlert({
      message: "Are you sure you want to delete this quiz? This action cannot be undone and all student attempts for this quiz will be permanently affected.",
      type: "warning",
      title: "Delete Quiz?",
      showCancel: true,
      confirmText: "Yes, Delete",
      cancelText: "Keep Quiz",
      onConfirm: () => {
        setDeletingId(id);
        deleteMutation.mutate(id);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Manage Quizzes</h1>
          <p className="text-sm text-gray-400 mt-1">View, edit, and delete existing quiz sets.</p>
        </div>
        <Link href="/admin/create-quiz">
          <GradientButton>+ Create New Quiz</GradientButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {quizzes.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <p className="text-gray-400">No quizzes found.</p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="glass rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider mb-2">
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{quiz.exam}</span>
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">{quiz.language}</span>
                </div>
                <h3 className="font-semibold text-white text-lg">{quiz.title}</h3>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1"><Clock size={14} /> {quiz.durationMinutes} mins</span>
                  <span className="flex items-center gap-1"><CheckCircle size={14} /> {quiz.totalMarks} marks</span>
                  <span>{quiz.questionCount} Questions</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                <Link href={`/admin/quizzes/${quiz.id}`} className="flex-1 md:flex-none">
                  <button className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors flex items-center justify-center gap-2">
                    <Edit3 size={16} /> Edit
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  disabled={deletingId === quiz.id}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm text-red-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingId === quiz.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
