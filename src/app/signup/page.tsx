"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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

      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        email,
        createdAt: serverTimestamp(),
        role: "player",
        membershipStatus: "free",
        membershipExpiresAt: null,
        level: 1,
        verified: false,
        yellowShards: 0,
      });

      // Create initial stats
      await setDoc(doc(db, "playerStats", user.uid), {
        userId: user.uid,
        health: 10,
        courage: 2,
        hope: 2,
        steel: 2,
        memory: 1,
      });

      // Create initial progress
      await setDoc(doc(db, "playerProgress", user.uid), {
        userId: user.uid,
        campaignId: "book1_red_country",
        currentNode: "book1_node_001",
        completedNodes: [],
        visitedNodes: ["book1_node_001"],
        unlockedNodes: ["book1_node_001", "book1_node_002"],
        revealedNodes: ["book1_node_001", "book1_node_002", "book1_node_003", "book1_node_004", "book1_node_005", "book1_node_006"],
        actionPoints: 3,
        mapFragments: 0,
        inventoryKeys: [],
        keyItems: [],
        alliesUnlocked: [],
        allySupports: [],
        statusEffects: [],
        questProgress: {
          book1_quest_first_step: { status: "active", steps: [] }
        },
        completed: false,
        updatedAt: serverTimestamp(),
      });

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

        <p className="text-center text-xs text-muted-foreground mt-8">
          Already a keeper? <Link href="/login" className="text-primary hover:underline">Return to the Path</Link>
        </p>
      </motion.div>
    </div>
  );
}
