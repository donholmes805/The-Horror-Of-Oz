"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
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
          <h1 className="font-serif text-3xl text-primary drop-shadow-[0_0_8px_rgba(184,134,11,0.6)] italic">Return to the Path</h1>
          <p className="text-muted-foreground text-sm mt-2">The Emerald City remembers you.</p>
        </div>

        {error && (
          <div className="bg-secondary/20 border border-secondary text-secondary text-xs p-3 rounded mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          <button 
            type="submit" 
            disabled={loading}
            className="w-full brass-button py-4 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Continue Journey"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          New to the horror? <Link href="/signup" className="text-primary hover:underline">Begin Your Chronicles</Link>
        </p>
      </motion.div>
    </div>
  );
}
