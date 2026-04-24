"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle, Link as LinkIcon, KeyRound, Mail, Trash2, CheckCircle, RefreshCcw } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { 
  updateProfile, 
  EmailAuthProvider, 
  linkWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail 
} from "firebase/auth";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingOptions } from "@/lib/firebase/firestore";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditAccountModal({ isOpen, onClose }: EditAccountModalProps) {
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: options } = useQuery({
    queryKey: ["onboarding_options"],
    queryFn: getOnboardingOptions,
  });
  
  // Form state
  const [name, setName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [personalRecommendations, setPersonalRecommendations] = useState(false);

  const isGoogleLinked = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');
  const isPasswordLinked = auth.currentUser?.providerData.some(p => p.providerId === 'password');

  useEffect(() => {
    if (user && isOpen) {
      setName(user.displayName);
      setClassLevel(user.classLevel);
      setTargetExam(user.targetExam);
      setPersonalRecommendations(user.personalRecommendations || false);
      setError(null);
      setSuccess(null);
    }
  }, [user, isOpen]);

  // Check if name can be changed
  const canChangeName = () => {
    if (!user?.nameUpdatedAt) return true;
    const nextAllowedDate = dayjs(user.nameUpdatedAt).add(30, 'day');
    return dayjs().isAfter(nextAllowedDate);
  };

  const nextNameChangeDate = user?.nameUpdatedAt 
    ? dayjs(user.nameUpdatedAt).add(30, 'day').format('DD MMM YYYY')
    : null;

  const handleSave = async () => {
    if (!user || !auth.currentUser) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: any = {};
      
      if (name !== user.displayName) {
        if (!canChangeName()) {
          throw new Error(`You can only change your name once a month. Next allowed date: ${nextNameChangeDate}`);
        }
        if (name.trim().length < 3) throw new Error("Name must be at least 3 characters.");
        
        updates.displayName = name.trim();
        updates.nameUpdatedAt = new Date().toISOString();
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      }

      if (classLevel !== user.classLevel) updates.classLevel = classLevel;
      if (targetExam !== user.targetExam) updates.targetExam = targetExam;
      if (personalRecommendations !== (user.personalRecommendations || false)) updates.personalRecommendations = personalRecommendations;

      if (Object.keys(updates).length > 0) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, updates);
        setUser({ ...user, ...updates });
        setSuccess("Profile updated successfully!");
        setTimeout(() => onClose(), 2000);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreGoogleData = async () => {
    if (!user || !auth.currentUser) return;
    const googleData = auth.currentUser.providerData.find(p => p.providerId === 'google.com');
    if (!googleData) return;

    setLoading(true);
    try {
      const updates = {
        displayName: googleData.displayName || user.displayName,
        photoURL: googleData.photoURL || user.photoURL,
        nameUpdatedAt: new Date().toISOString() // Reset timer since they are syncing
      };

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updates);
      await updateProfile(auth.currentUser, { 
        displayName: updates.displayName,
        photoURL: updates.photoURL
      });

      setUser({ ...user, ...updates });
      setName(updates.displayName);
      setSuccess("Profile synced with Google!");
    } catch (err: any) {
      setError("Failed to sync with Google: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      setSuccess("Google account linked successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccess("Password reset email sent. Check your inbox.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#0f0c29] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
            <h2 className="text-xl font-bold text-white">Edit Account</h2>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-start gap-2">
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                <p>{success}</p>
              </div>
            )}

            {/* Profile Info Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Basic Info</h3>
                {isGoogleLinked && (
                  <button 
                    onClick={handleRestoreGoogleData}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-400/10 px-2 py-1 rounded-lg transition-colors uppercase"
                  >
                    <RefreshCcw size={10} /> Sync with Google
                  </button>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1 ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canChangeName()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
                />
                {!canChangeName() && (
                  <p className="text-xs text-orange-400 mt-1 ml-1 flex items-center gap-1">
                    <AlertCircle size={10} /> Next change allowed on {nextNameChangeDate}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Class</label>
                  <select 
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full bg-[#1a163a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50"
                  >
                    {options?.classes.map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Target Exam</label>
                  <select 
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full bg-[#1a163a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50"
                  >
                    {options?.exams.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Personal Recommendations Toggle */}
              <div className="flex items-center justify-between p-3 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-bold text-white mb-0.5">Personal Recommendations</p>
                  <p className="text-[10px] text-gray-400 leading-tight">Auto-filter quizzes based on your target exam ({targetExam})</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPersonalRecommendations(!personalRecommendations)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    personalRecommendations ? "bg-purple-600" : "bg-gray-700"
                  }`}
                >
                  <motion.div
                    animate={{ x: personalRecommendations ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Security & Linking Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Security & Login</h3>
              
              <div className="space-y-2">
                {!isGoogleLinked && (
                  <button onClick={handleLinkGoogle} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg"><LinkIcon size={16} className="text-blue-400" /></div>
                      <div className="text-left">
                        <p className="text-sm text-white font-medium">Link Google Account</p>
                        <p className="text-xs text-gray-400">Sign in instantly with Google</p>
                      </div>
                    </div>
                  </button>
                )}

                <button onClick={handlePasswordReset} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg"><KeyRound size={16} className="text-yellow-400" /></div>
                    <div className="text-left">
                      <p className="text-sm text-white font-medium">{isPasswordLinked ? "Change Password" : "Add Password"}</p>
                      <p className="text-xs text-gray-400">Send a password reset/setup email</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Danger Zone */}
            <div className="space-y-3 pb-4">
              <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider">Danger Zone</h3>
              <button 
                onClick={() => setError("Account deletion is a permanent action. Please contact support to proceed.")} 
                className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg"><Trash2 size={16} className="text-red-400" /></div>
                  <div className="text-left">
                    <p className="text-sm text-red-400 font-medium">Request Account Deletion</p>
                    <p className="text-xs text-red-500/70">Permanently delete your data</p>
                  </div>
                </div>
              </button>
            </div>

          </div>

          <div className="p-5 border-t border-white/10 flex justify-end gap-3 shrink-0">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
