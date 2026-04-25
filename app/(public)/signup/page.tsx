"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { createUser, getUser } from "@/lib/firebase/firestore";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { cn } from "@/lib/helpers";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const googleProvider = new GoogleAuthProvider();

// Sub-components moved outside to prevent focus loss on re-render
const SocialLogin = ({ handleGoogle, googleLoading }: { handleGoogle: () => void; googleLoading: boolean }) => (
  <div className="w-full">
    <div className="flex items-center gap-3 my-6 w-full max-w-[280px] mx-auto">
      <hr className="flex-1 border-white/10" />
      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Or continue with</span>
      <hr className="flex-1 border-white/10" />
    </div>
    <button 
      type="button" 
      onClick={handleGoogle} 
      disabled={googleLoading}
      className="w-full max-w-[280px] mx-auto flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 rounded-2xl py-3.5 text-sm font-bold transition-all hover:shadow-xl active:scale-95 disabled:opacity-70"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Google
    </button>
  </div>
);

const SignupFormContent = ({ 
  prefix, signupForm, handleSignupChange, handleSignupSubmit, errors, globalError, isLogin, loading, showPassword, setShowPassword, handleGoogle, googleLoading 
}: any) => (
  <form onSubmit={handleSignupSubmit} className="w-full max-w-sm mx-auto space-y-4" noValidate>
    <div className="text-center mb-8">
      <h2 className="text-3xl font-black text-white mb-2">Create Account</h2>
      <p className="text-gray-400 text-sm">Join Brain Circuit today.</p>
    </div>
    
    {globalError && !isLogin && (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4 text-center">
        {globalError}
      </div>
    )}

    <div>
      <div className="relative group">
        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
        <input
          id={`${prefix}-name`} name="name" type="text" autoComplete="name"
          value={signupForm.name} onChange={handleSignupChange} placeholder="Full Name"
          className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:bg-black/40 outline-none transition-all shadow-inner"
        />
      </div>
      {errors.name && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.name}</p>}
    </div>

    <div>
      <div className="relative group">
        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
        <input
          id={`${prefix}-email`} name="email" type="email" autoComplete="email"
          value={signupForm.email} onChange={handleSignupChange} placeholder="Email Address"
          className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:bg-black/40 outline-none transition-all shadow-inner"
        />
      </div>
      {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>}
    </div>

    <div>
      <div className="relative group">
        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
        <input
          id={`${prefix}-password`} name="password"
          type={showPassword ? "text" : "password"} autoComplete="new-password"
          value={signupForm.password} onChange={handleSignupChange} placeholder="Password (Min. 6 chars)"
          className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:bg-black/40 outline-none transition-all shadow-inner"
        />
        <button type="button" onClick={() => setShowPassword((v: boolean) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      
      {signupForm.password.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-black/40 border border-white/5 rounded-xl space-y-2"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: "Min. 6 chars", met: signupForm.password.length >= 6 },
              { label: "One Uppercase", met: /[A-Z]/.test(signupForm.password) },
              { label: "One Lowercase", met: /[a-z]/.test(signupForm.password) },
              { label: "One Number", met: /[0-9]/.test(signupForm.password) },
              { label: "Special Char", met: /[^A-Za-z0-9]/.test(signupForm.password) },
            ].map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn(
                  "w-1 h-1 rounded-full transition-all duration-300",
                  req.met ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-gray-600"
                )} />
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                  req.met ? "text-green-400" : "text-gray-500"
                )}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {errors.password && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.password}</p>}
    </div>

    <GradientButton type="submit" fullWidth isLoading={loading && !isLogin} className="mt-6 py-4 rounded-2xl text-base shadow-purple-500/25">
      Sign Up
    </GradientButton>
    
    <SocialLogin handleGoogle={handleGoogle} googleLoading={googleLoading} />
  </form>
);

const LoginFormContent = ({ 
  prefix, loginForm, handleLoginChange, handleLoginSubmit, globalError, isLogin, loading, showPassword, setShowPassword, handleGoogle, googleLoading 
}: any) => (
  <form onSubmit={handleLoginSubmit} className="w-full max-w-sm mx-auto space-y-4" noValidate>
    <div className="text-center mb-8">
      <h2 className="text-3xl font-black text-white mb-2">Welcome Back</h2>
      <p className="text-gray-400 text-sm">Please log in to your account.</p>
    </div>

    {globalError && isLogin && (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4 text-center">
        {globalError}
      </div>
    )}

    <div>
      <div className="relative group">
        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
        <input
          id={`${prefix}-login-email`} name="email" type="email" autoComplete="email"
          value={loginForm.email} onChange={handleLoginChange} placeholder="Email Address"
          className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:bg-black/40 outline-none transition-all shadow-inner"
        />
      </div>
    </div>

    <div>
      <div className="relative group">
        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
        <input
          id={`${prefix}-login-password`} name="password"
          type={showPassword ? "text" : "password"} autoComplete="current-password"
          value={loginForm.password} onChange={handleLoginChange} placeholder="Password"
          className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:bg-black/40 outline-none transition-all shadow-inner"
        />
        <button type="button" onClick={() => setShowPassword((v: boolean) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>

    <button type="button" className="text-xs text-blue-400 hover:text-blue-300 font-medium float-right mt-2 transition-colors">
      Forgot password?
    </button>
    <div className="clear-both" />

    <GradientButton 
      type="submit" 
      fullWidth 
      isLoading={loading && isLogin} 
      className="mt-6 py-4 rounded-2xl text-base shadow-blue-500/25 from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
    >
      Log In
    </GradientButton>

    <SocialLogin handleGoogle={handleGoogle} googleLoading={googleLoading} />
  </form>
);

export default function AuthPage() {
  const router = useRouter();
  
  // UI State
  const [isLogin, setIsLogin] = useState(false); // Default to signup
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const toggleMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setErrors({});
    setGlobalError("");
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: "" }));
    setGlobalError("");
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setGlobalError("");
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(signupForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password);
      await updateProfile(cred.user, { displayName: signupForm.name });
      await createUser(cred.user.uid, {
        email: signupForm.email,
        displayName: signupForm.name,
        profileComplete: false,
      } as Parameters<typeof createUser>[1]);
      router.push("/complete-profile");
    } catch (err: unknown) {
      setGlobalError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setGlobalError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      const fbUser = auth.currentUser;
      if (fbUser) {
        const profile = await getUser(fbUser.uid);
        if (!profile || !profile.profileComplete) {
          router.push("/complete-profile");
        } else {
          router.push("/home");
        }
      }
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
    <main className="min-h-dvh flex items-center justify-center p-4 sm:p-8 overflow-hidden relative bg-gray-950">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-700/20 blur-[120px] pointer-events-none" />

      {/* 
        ==============================
        UNIFIED STACKED VIEW (ALL DEVICES)
        ==============================
      */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        <div className="w-16 h-16 rounded-[2rem] bg-white flex items-center justify-center mb-6 shadow-xl border border-white/10">
          <img src="/images/only_logo.png" alt="Logo" className="w-10 h-10 object-contain" />
        </div>
        
        {/* Toggle Switch */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl mb-8 w-full relative border border-white/10 shadow-inner">
          <div className={cn(
            "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl transition-transform duration-300 ease-in-out shadow-lg",
            isLogin ? "translate-x-[calc(100%+6px)] bg-gradient-to-r from-blue-600 to-cyan-600" : "translate-x-0 bg-gradient-to-r from-purple-600 to-indigo-600"
          )} />
          <button 
            onClick={() => toggleMode(false)} 
            className={cn("flex-1 py-3 text-sm font-bold z-10 transition-colors rounded-xl", !isLogin ? "text-white" : "text-gray-400")}
          >
            Sign Up
          </button>
          <button 
            onClick={() => toggleMode(true)} 
            className={cn("flex-1 py-3 text-sm font-bold z-10 transition-colors rounded-xl", isLogin ? "text-white" : "text-gray-400")}
          >
            Log In
          </button>
        </div>

        <div className="w-full glass-md border border-white/10 rounded-3xl p-6 sm:p-8 relative min-h-[550px] overflow-hidden">
          <AnimatePresence mode="wait">
            {!isLogin ? (
              <motion.div 
                key="signup-mobile" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full absolute inset-0 p-6 sm:p-8"
              >
                <SignupFormContent 
                  prefix="auth" 
                  signupForm={signupForm}
                  handleSignupChange={handleSignupChange}
                  handleSignupSubmit={handleSignupSubmit}
                  errors={errors}
                  globalError={globalError}
                  isLogin={isLogin}
                  loading={loading}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  handleGoogle={handleGoogle}
                  googleLoading={googleLoading}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="login-mobile" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full absolute inset-0 p-6 sm:p-8"
              >
                <LoginFormContent 
                  prefix="auth" 
                  loginForm={loginForm}
                  handleLoginChange={handleLoginChange}
                  handleLoginSubmit={handleLoginSubmit}
                  globalError={globalError}
                  isLogin={isLogin}
                  loading={loading}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  handleGoogle={handleGoogle}
                  googleLoading={googleLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function getFriendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Password is too weak.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}
