"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Sword, Shield, Skull, Zap, Trophy, Lock, Key } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable Animation & Effect Components for The Horror of Oz.
 */

// 1. Floating Damage / Stat Indicator
export function StatPop({ value, type, x, y }: { value: string | number, type: 'damage' | 'heal' | 'ap' | 'shard' | 'stat', x: number, y: number }) {
  const colors = {
    damage: 'text-red-500',
    heal: 'text-emerald-500',
    ap: 'text-blue-400',
    shard: 'text-amber-500',
    stat: 'text-primary'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: y, x: x, scale: 0.5 }}
      animate={{ opacity: 1, y: y - 50, scale: 1.2 }}
      exit={{ opacity: 0, scale: 1.5 }}
      className={cn("fixed z-[200] font-serif italic text-2xl pointer-events-none drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]", colors[type])}
    >
      {value}
    </motion.div>
  );
}

// 2. Boss Warning Effect
export function BossWarning({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none bg-red-950/20 backdrop-blur-sm"
    >
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Skull className="w-24 h-24 text-red-600 mx-auto drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
        </motion.div>
        <h2 className="text-6xl font-serif italic text-white uppercase tracking-tighter drop-shadow-2xl">
          {title}
        </h2>
        <div className="h-px w-64 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto" />
        <p className="text-red-500 font-serif italic uppercase tracking-[0.3em] text-sm animate-pulse">Critical Threat Detected</p>
      </div>
    </motion.div>
  );
}

// 3. Reward Reveal Animation
export function RewardReveal({ name, type }: { name: string, type: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-6 group"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
        {type === 'shard' ? <Zap className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-amber-500/60 font-black">Reward Uncovered</p>
        <h4 className="text-2xl text-white font-serif italic">{name}</h4>
      </div>
    </motion.div>
  );
}

// 4. Quest Complete Cinematic
export function QuestCompleteEffect({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl"
    >
      <div className="text-center space-y-8 max-w-lg p-12 relative">
        <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ type: "spring", damping: 12 }}
        >
          <Trophy className="w-24 h-24 text-primary mx-auto drop-shadow-[0_0_30px_rgba(184,134,11,0.5)]" />
        </motion.div>
        
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.5em] text-primary/60 font-black">Chronicle Milestone Reached</p>
          <h2 className="text-5xl md:text-6xl font-serif italic text-white leading-tight">Quest Complete</h2>
          <p className="text-xl text-primary/80 font-serif italic">{title}</p>
        </div>

        <div className="pt-8 flex justify-center gap-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <div className="w-2 h-2 rounded-full bg-primary animate-ping delay-75" />
          <div className="w-2 h-2 rounded-full bg-primary animate-ping delay-150" />
        </div>
      </div>
    </motion.div>
  );
}

// 5. Door Unlock Animation
export function UnlockAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 1.5], rotate: [0, 0, 360, 360] }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-[40px] rounded-full animate-pulse" />
        <Key className="w-32 h-32 text-primary relative z-10 drop-shadow-[0_0_20px_rgba(184,134,11,1)]" />
      </div>
    </motion.div>
  );
}
