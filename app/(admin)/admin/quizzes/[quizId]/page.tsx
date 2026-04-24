"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuizSet, updateQuizSet, getOnboardingOptions } from "@/lib/firebase/firestore";
import { useUIStore } from "@/store/uiStore";
import Link from "next/link";
import { ArrowLeft, Save, Edit2, CheckCircle, XCircle } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import type { Question, QuizSet } from "@/types";

export default function EditQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const router = useRouter();
  const { quizId } = use(params);
  const queryClient = useQueryClient();
  const { showAlert } = useUIStore();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempQuestion, setTempQuestion] = useState<Question | null>(null);
  const [editingSettings, setEditingSettings] = useState<Partial<QuizSet> | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["admin-quiz", quizId],
    queryFn: () => getQuizSet(quizId),
  });

  const { data: options } = useQuery({
    queryKey: ["onboarding-options"],
    queryFn: getOnboardingOptions,
  });

  const updateMutation = useMutation({
    mutationFn: (newQuiz: Partial<QuizSet>) => updateQuizSet(quizId, newQuiz),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quiz", quizId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quizzes"] });
      setEditingIndex(null);
      setTempQuestion(null);
    },
    onError: (err) => {
      console.error(err);
      showAlert({ 
        message: "Failed to update the quiz. Please check your connection and try again.", 
        type: "error", 
        title: "Update Failed" 
      });
    },
  });

  const startEdit = (index: number) => {
    if (!quiz) return;
    setEditingIndex(index);
    setTempQuestion(JSON.parse(JSON.stringify(quiz.questions[index]))); // deep copy
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setTempQuestion(null);
  };

  const saveQuestionEdit = () => {
    if (!quiz || !tempQuestion || editingIndex === null) return;
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[editingIndex] = tempQuestion;
    updateMutation.mutate({ questions: updatedQuestions });
  };

  const handleOptionChange = (idx: number, val: string) => {
    if (!tempQuestion) return;
    const newOptions = [...tempQuestion.options];
    newOptions[idx] = val;
    setTempQuestion({ ...tempQuestion, options: newOptions });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Quiz not found.</p>
        <Link href="/admin/quizzes" className="text-purple-400 mt-4 inline-block">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/quizzes">
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{quiz.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Editing {quiz.questions.length} Questions</p>
          </div>
        </div>
        {!editingSettings && (
          <button 
            onClick={() => setEditingSettings({
              title: quiz.title,
              description: quiz.description,
              exam: quiz.exam,
              classLevel: quiz.classLevel,
              subjects: quiz.subjects,
              language: quiz.language,
              durationMinutes: quiz.durationMinutes,
              marksPerQuestion: quiz.marksPerQuestion,
              negativeMarks: quiz.negativeMarks,
              questionCount: quiz.questionCount,
              badge: quiz.badge,
            })}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <Edit2 size={16} /> Edit Settings
          </button>
        )}
      </div>

      {editingSettings && (
        <div className="glass-md rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Edit Quiz Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Quiz Title</label>
              <input type="text" value={editingSettings.title} onChange={e => setEditingSettings({...editingSettings, title: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Description</label>
              <textarea value={editingSettings.description || ""} onChange={e => setEditingSettings({...editingSettings, description: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 min-h-[60px]" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Exam</label>
              <select value={editingSettings.exam} onChange={e => setEditingSettings({...editingSettings, exam: e.target.value as QuizSet['exam']})} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500">
                <option value="NEET">NEET</option>
                <option value="JEE Mains">JEE Mains</option>
                <option value="JEE Advanced">JEE Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Class</label>
              <select value={editingSettings.classLevel} onChange={e => setEditingSettings({...editingSettings, classLevel: e.target.value as QuizSet['classLevel']})} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500">
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
                <option value="Dropper">Dropper</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Subject</label>
              <select value={editingSettings.subjects?.[0] || "Physics"} onChange={e => setEditingSettings({...editingSettings, subjects: [e.target.value]})} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500">
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Maths">Maths</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Language</label>
              <select value={editingSettings.language} onChange={e => setEditingSettings({...editingSettings, language: e.target.value as QuizSet['language']})} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500">
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Bengali">Bengali</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Corner Badge</label>
              <select 
                value={editingSettings.badge?.label || ""} 
                onChange={e => {
                  const label = e.target.value;
                  if (!label) {
                    const newSettings = { ...editingSettings };
                    delete newSettings.badge;
                    setEditingSettings(newSettings);
                  } else {
                    const found = options?.badges?.find(b => b.label === label);
                    setEditingSettings({...editingSettings, badge: found});
                  }
                }} 
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500"
              >
                <option value="">None</option>
                {(options?.badges || []).map(b => (
                  <option key={b.label} value={b.label}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Duration (m)</label>
              <input type="number" value={editingSettings.durationMinutes} onChange={e => setEditingSettings({...editingSettings, durationMinutes: Number(e.target.value)})} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Questions Per Attempt (Max {quiz.questions.length})</label>
              <input type="number" value={editingSettings.questionCount} onChange={e => setEditingSettings({...editingSettings, questionCount: Number(e.target.value)})} max={quiz.questions.length} min={1} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">+ Marks / Q</label>
              <input type="number" value={editingSettings.marksPerQuestion} onChange={e => setEditingSettings({...editingSettings, marksPerQuestion: Number(e.target.value)})} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">- Negative Marks</label>
              <input type="number" value={editingSettings.negativeMarks} onChange={e => setEditingSettings({...editingSettings, negativeMarks: Number(e.target.value)})} className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-purple-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
            <button onClick={() => setEditingSettings(null)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors">
              Cancel
            </button>
            <GradientButton 
              onClick={() => {
                // Ensure total marks is recalculated
                const newSettings = {
                  ...editingSettings,
                  totalMarks: (editingSettings.questionCount || 0) * (editingSettings.marksPerQuestion || 0)
                };
                updateMutation.mutate(newSettings);
                setEditingSettings(null);
              }} 
              isLoading={updateMutation.isPending}
              className="py-2"
            >
              <Save size={16} className="mr-2" /> Save Settings
            </GradientButton>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {quiz.questions.map((q, i) => {
          const isEditing = editingIndex === i;

          return (
            <div key={q.id} className="glass rounded-xl p-5 border border-white/5">
              {isEditing && tempQuestion ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-purple-400">Editing Question {i + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-3">
                      <label className="text-xs text-gray-400 mb-1 block">Question Text</label>
                      <textarea
                        value={tempQuestion.text}
                        onChange={(e) => setTempQuestion({ ...tempQuestion, text: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Question Type</label>
                      <select
                        value={tempQuestion.type}
                        onChange={(e) => {
                          const newType = e.target.value as "single" | "multi" | "integer";
                          let newCorrectOptions = tempQuestion.correctOptions;
                          // Reset correct options gracefully if switching between paradigms
                          if (newType === "integer" && tempQuestion.type !== "integer") {
                            newCorrectOptions = [0]; // default to 0
                          } else if (newType !== "integer" && tempQuestion.type === "integer") {
                            newCorrectOptions = [0]; // default to option A (index 0)
                          } else if (newType === "single" && tempQuestion.correctOptions.length > 1) {
                            newCorrectOptions = [tempQuestion.correctOptions[0]]; // keep first selection
                          }
                          setTempQuestion({ ...tempQuestion, type: newType, correctOptions: newCorrectOptions });
                        }}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="single">Single MCQ</option>
                        <option value="multi">Multi MCQ</option>
                        <option value="integer">Integer Type</option>
                      </select>
                    </div>
                  </div>

                  {tempQuestion.type !== "integer" ? (
                    <div className="space-y-3 mt-4">
                      <label className="text-xs text-gray-400 block mb-1">Options</label>
                      {tempQuestion.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (tempQuestion.type === "single") {
                                setTempQuestion({ ...tempQuestion, correctOptions: [optIdx] });
                              } else {
                                const isCorrect = tempQuestion.correctOptions.includes(optIdx);
                                const newCorrect = isCorrect 
                                  ? tempQuestion.correctOptions.filter(x => x !== optIdx)
                                  : [...tempQuestion.correctOptions, optIdx];
                                setTempQuestion({ ...tempQuestion, correctOptions: newCorrect });
                              }
                            }}
                            className={`w-6 h-6 rounded-md flex shrink-0 items-center justify-center border-2 ${
                              tempQuestion.correctOptions.includes(optIdx)
                                ? "bg-green-500/20 border-green-500 text-green-400"
                                : "border-gray-600 hover:border-gray-500 text-transparent"
                            }`}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                            className="flex-1 bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      ))}
                      <p className="text-[10px] text-gray-500 mt-1">Click the checkbox to mark option as correct.</p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label className="text-xs text-gray-400 block mb-1">Correct Numeric Answer</label>
                      <input
                        type="number"
                        step="any"
                        value={tempQuestion.correctOptions[0] ?? 0}
                        onChange={(e) => setTempQuestion({ ...tempQuestion, correctOptions: [parseFloat(e.target.value)] })}
                        className="w-full max-w-xs bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <GradientButton 
                      onClick={saveQuestionEdit} 
                      isLoading={updateMutation.isPending}
                      className="py-2"
                    >
                      <Save size={16} className="mr-2" /> Save Changes
                    </GradientButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-sm text-white whitespace-pre-wrap flex-1">
                      <span className="font-bold text-gray-500 mr-2">Q{i + 1}.</span>
                      {q.text}
                    </p>
                    <button
                      onClick={() => startEdit(i)}
                      className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors shrink-0"
                      title="Edit Question"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  {q.type !== "integer" ? (
                    <div className="mt-4 pl-6 space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOptions.includes(optIdx);
                        return (
                          <div key={optIdx} className={`text-sm flex items-start gap-2 ${isCorrect ? "text-green-300 font-medium" : "text-gray-400"}`}>
                            <div className="mt-0.5 shrink-0">
                              {isCorrect ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="opacity-30" />}
                            </div>
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 pl-6">
                      <p className="text-sm text-green-300 font-bold flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-400" />
                        Numeric Answer: {q.correctOptions[0]}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
