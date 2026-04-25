"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTestGroups, createTestGroup, updateTestGroup, deleteTestGroup, getQuizSets } from "@/lib/firebase/firestore";
import type { TestGroup, QuizSet } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, Edit2, Loader2, Save, X } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { useUIStore } from "@/store/uiStore";

export default function TestGroupsPage() {
  const queryClient = useQueryClient();
  const { showAlert } = useUIStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", order: 0, isPublished: true, quizIds: [] as string[] });
  const [orderError, setOrderError] = useState<string | null>(null);

  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ["test-groups"],
    queryFn: getTestGroups,
  });

  const { data: quizzes = [], isLoading: loadingQuizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => getQuizSets() as any,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) return updateTestGroup(editingId, data);
      return createTestGroup(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-groups"] });
      closeModal();
      showAlert({ message: "Test group saved successfully", type: "success" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTestGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-groups"] });
      showAlert({ message: "Test group deleted", type: "success" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => 
      updateTestGroup(id, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-groups"] });
      showAlert({ message: "Visibility updated", type: "success" });
    },
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ title: "", order: groups.length, isPublished: true, quizIds: [] });
    setModalOpen(true);
  };

  const openEditModal = (group: TestGroup) => {
    setEditingId(group.id);
    setFormData({ title: group.title, order: group.order, isPublished: group.isPublished ?? true, quizIds: group.quizIds || [] });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", order: 0, isPublished: true, quizIds: [] });
    setOrderError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return showAlert({ message: "Title is required", type: "warning" });
    // Check for duplicate order
    const duplicate = groups.find(g => g.order === formData.order && g.id !== editingId);
    if (duplicate) {
      setOrderError(`Order ${formData.order} is already used by "${duplicate.title}"`);
      return;
    }
    setOrderError(null);
    mutation.mutate(formData);
  };

  const toggleQuiz = (quizId: string) => {
    setFormData(prev => ({
      ...prev,
      quizIds: prev.quizIds.includes(quizId)
        ? prev.quizIds.filter(id => id !== quizId)
        : [...prev.quizIds, quizId]
    }));
  };

  if (loadingGroups || loadingQuizzes) {
    return <div className="flex justify-center items-center h-full py-20"><Loader2 className="animate-spin text-purple-400" /></div>;
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Manage Test Groups</h1>
          <p className="text-gray-400">Create categorized collections of quizzes to show on the public Tests page.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 transition-colors rounded-xl text-white font-semibold text-sm shrink-0 ml-4"
        >
          <Plus size={16} />
          Create Group
        </button>
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl flex items-center justify-between border border-white/10 bg-white/5"
          >
            <div>
              <h3 className="font-bold text-lg text-white">{group.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Order: {group.order} &bull; {group.quizIds?.length || 0} Quizzes
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Slidable Publish Toggle */}
              <button
                onClick={() => togglePublishMutation.mutate({ 
                  id: group.id, 
                  isPublished: !(group.isPublished ?? true) 
                })}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                  (group.isPublished ?? true) ? 'bg-purple-600' : 'bg-white/10'
                }`}
                title={(group.isPublished ?? true) ? 'Unpublish' : 'Publish'}
              >
                <motion.div
                  animate={{ x: (group.isPublished ?? true) ? 20 : 2 }}
                  className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(group as TestGroup)}
                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this group?")) {
                      deleteMutation.mutate(group.id);
                    }
                  }}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {groups.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus size={22} className="opacity-40" />
            </div>
            No test groups yet. Press <span className="text-purple-400 font-semibold">Create Group</span> to get started.
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop + centering wrapper */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              {/* Modal Panel */}
              <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-[520px] max-h-[85vh] z-50 glass-md rounded-2xl border border-white/20 flex flex-col overflow-hidden"
              >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? "Edit Group" : "Create New Group"}
                </h2>
                <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Group Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Class 11, Mock Tests..."
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-gray-400">Display Order</label>
                      {orderError && (
                        <span className="text-[10px] text-red-400 font-medium">{orderError}</span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={e => {
                        setOrderError(null);
                        setFormData({ ...formData, order: Number(e.target.value) });
                      }}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white outline-none focus:border-purple-500 transition-colors ${
                        orderError ? "border-red-500/60" : "border-white/10"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Select Quizzes <span className="text-purple-400">({formData.quizIds.length} selected)</span>
                    </label>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {quizzes.map((q: QuizSet) => {
                        const selectionIndex = formData.quizIds.indexOf(q.id);
                        const isSelected = selectionIndex !== -1;
                        return (
                          <div
                            key={q.id}
                            onClick={() => toggleQuiz(q.id)}
                            className={`cursor-pointer p-2.5 rounded-lg text-xs transition-colors border flex items-center gap-3 ${
                              isSelected
                                ? "bg-purple-500/20 border-purple-500/50 text-white"
                                : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                            }`}
                          >
                            {/* Order badge */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected
                                ? "bg-purple-500 text-white"
                                : "bg-white/10 text-gray-500"
                            }`}>
                              {isSelected ? selectionIndex + 1 : ""}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{q.title}</div>
                              <div className="text-[10px] opacity-70 mt-0.5">{Array.isArray(q.exam) ? q.exam.join(", ") : q.exam} &bull; {q.subjects?.[0]}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 rounded-xl border border-white/15 text-white hover:bg-white/5 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {mutation.isPending ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <Save size={15} />
                    )}
                    {editingId ? "Update Group" : "Create Group"}
                  </button>
                </div>
              </form>
            </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
