"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { updateUser, getUser, getOnboardingOptions } from "@/lib/firebase/firestore";
import GradientButton from "@/components/ui/GradientButton";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, setUser, firebaseUid } = useUserStore();
  const [loading, setLoading] = useState(false);
  
  const { data: options, isLoading: loadingOptions } = useQuery({
    queryKey: ["onboarding-options"],
    queryFn: getOnboardingOptions,
  });

  const [form, setForm] = useState({
    language: "",
    classLevel: "",
    targetExam: "",
    dob: "",
  });

  // Set defaults once options are loaded
  useEffect(() => {
    if (options && !form.language) {
      setForm((f) => ({
        ...f,
        language: options.languages[0] || "",
        classLevel: options.classes[0] || "",
        targetExam: options.exams[0] || "",
      }));
    }
  }, [options]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUid) return;
    if (!form.dob) return alert("Please enter your date of birth.");

    setLoading(true);
    try {
      await updateUser(firebaseUid, {
        language: form.language,
        classLevel: form.classLevel,
        targetExam: form.targetExam,
        dob: form.dob,
        profileComplete: true,
      });
      const updated = await getUser(firebaseUid);
      if (updated) setUser(updated);
      router.push("/home");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!firebaseUid || loadingOptions) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm glass-md rounded-3xl p-6"
      >
        <h1 className="font-display font-bold text-2xl text-white mb-2">Complete Profile</h1>
        <p className="text-gray-400 text-sm mb-6">Tell us about your preparation to personalize your experience.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Target Exam</label>
            <select
              name="targetExam"
              value={form.targetExam}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none"
            >
              {options?.exams.map((exam) => (
                <option key={exam} value={exam} className="bg-gray-900">{exam}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Class</label>
            <select
              name="classLevel"
              value={form.classLevel}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none"
            >
              {options?.classes.map((cls) => (
                <option key={cls} value={cls} className="bg-gray-900">{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Preferred Language</label>
            <select
              name="language"
              value={form.language}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none"
            >
              {options?.languages.map((lang) => (
                <option key={lang} value={lang} className="bg-gray-900">{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none [color-scheme:dark]"
            />
          </div>

          <GradientButton type="submit" fullWidth isLoading={loading} className="mt-4">
            Continue to App
          </GradientButton>
        </form>
      </motion.div>
    </main>
  );
}
