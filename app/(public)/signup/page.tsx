"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { createUser, getUser } from "@/lib/firebase/firestore";
import { Brain, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { motion } from "framer-motion";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const googleProvider = new GoogleAuthProvider();

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: "" }));
    setGlobalError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });
      await createUser(cred.user.uid, {
        email: form.email,
        displayName: form.name,
        profileComplete: false,
      } as Parameters<typeof createUser>[1]);
      router.push("/complete-profile");
    } catch (err: unknown) {
      setGlobalError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await getUser(cred.user.uid);
      if (!existing) {
        await createUser(cred.user.uid, {
          email: cred.user.email ?? "",
          displayName: cred.user.displayName ?? "",
          photoURL: cred.user.photoURL ?? "",
          profileComplete: false,
        } as Parameters<typeof createUser>[1]);
        router.push("/complete-profile");
      } else if (!existing.profileComplete) {
        router.push("/complete-profile");
      } else {
        router.push("/home");
      }
    } catch (err: unknown) {
      setGlobalError(getFriendlyError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-700/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-700/25 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand-vivid flex items-center justify-center shadow-glow mb-4">
            <Brain size={32} className="text-white" />
          </div>
          <h1 className="font-display font-black text-3xl gradient-text">Brain Circuit</h1>
          <p className="text-gray-400 text-sm mt-1">Start your journey to the top!</p>
        </div>

        <div className="glass-md rounded-3xl p-6">
          {globalError && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {[
              { id: "name", label: "Full Name", type: "text", icon: <User size={16} />, placeholder: "Riya Sharma", autoComplete: "name" },
              { id: "email", label: "Email", type: "email", icon: <Mail size={16} />, placeholder: "you@example.com", autoComplete: "email" },
            ].map(({ id, label, type, icon, placeholder, autoComplete }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>
                  <input
                    id={id} name={id} type={type} autoComplete={autoComplete}
                    value={form[id as keyof typeof form]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-default"
                  />
                </div>
                {errors[id] && <p className="text-red-400 text-xs mt-1">{errors[id]}</p>}
              </div>
            ))}

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-default"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <GradientButton type="submit" fullWidth isLoading={loading} className="mt-2">
              Create Account
            </GradientButton>
          </form>

          <div className="flex items-center gap-3 my-4">
            <hr className="flex-1 border-white/10" />
            <span className="text-gray-500 text-xs">OR</span>
            <hr className="flex-1 border-white/10" />
          </div>

          <GradientButton variant="secondary" fullWidth isLoading={googleLoading} onClick={handleGoogle} type="button">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </GradientButton>

          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">Log in</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

function getFriendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Password is too weak.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}
