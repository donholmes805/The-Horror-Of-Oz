"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { initializeUser } from "@/lib/auth-utils";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms || !confirmedAge) {
      setError("Please agree to the terms and confirm your age.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await initializeUser(user.uid, email, username, refCode || undefined);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        await initializeUser(user.uid, user.email, user.displayName || "Pathwalker", refCode || undefined);
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background with fog */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi44PQ9kzwTJERp0H0hZLb3h1wy_7uBTlixFYERq7UlBBGYZQZvHytLBmMAp54nWMzr2GgsiUntxPQDhn35VaylIP0rBOePcMY8Uhak12H7doRUgmHfRHREbjll4Odx9VUIe4qGpVk1pBGJjC2NKpPH8Jvv3KdNIF1l2pKI7Jsmjn206sx1LDrOO6E12xCh4mduZGs8tFU6NlDP6ryxRUP4jx-2wmJucHrgm1JPb6kJfQxdomR0j60WnvUijKcW0YBNPnnMmI82AZF"
          className="w-full h-full object-cover opacity-20"
          alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background"></div>
        <div className="cinematic-fog opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md gothic-panel p-8 rounded-xl"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-primary drop-shadow-[0_0_8px_rgba(184,134,11,0.6)] italic">Join the Chronicles</h1>
          <p className="text-muted-foreground text-sm mt-2">Walk the Yellow Path. Survive the Horror.</p>
        </div>

        {error && (
          <div className="bg-secondary/20 border border-secondary text-secondary text-xs p-3 rounded mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-primary mb-1 font-bold">Username</label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-primary/20 p-3 text-sm focus:border-primary outline-none transition-all"
              placeholder="Pathwalker"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-primary mb-1 font-bold">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-primary/20 p-3 text-sm focus:border-primary outline-none transition-all"
              placeholder="seeker@oz.com"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-primary mb-1 font-bold">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-primary/20 p-3 text-sm focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2 py-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 rounded border-primary/20 bg-black/40 text-primary focus:ring-primary/20"
              />
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">I AGREE TO THE TERMS OF SURVIVAL</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={confirmedAge}
                onChange={(e) => setConfirmedAge(e.target.checked)}
                className="w-4 h-4 rounded border-primary/20 bg-black/40 text-primary focus:ring-primary/20"
              />
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">I CONFIRM I AM AT LEAST 18 YEARS OF AGE</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full brass-button py-4 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Initializing..." : "Begin Journey"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary/20"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-[#0a0a0a] px-4 text-muted-foreground">Or summon with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-4 hover:bg-white/10 transition-all rounded disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest text-white">The Seeker's Eye (Google)</span>
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Already a keeper? <Link href="/login" className="text-primary hover:underline">Return to the Path</Link>
        </p>
      </motion.div>
    </div>
  );
}
