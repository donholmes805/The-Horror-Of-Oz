"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  User, 
  Cpu, 
  Swords, 
  Users, 
  Compass, 
  Lock, 
  Crown, 
  ArrowRight, 
  Play,
  Settings,
  History
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { hasPaidAccess, isInternalUser } from '@/lib/auth-utils';
import { cn } from '@/lib/utils';

const MODES = [
  {
    id: 'solo',
    title: 'Solo Story Mode',
    desc: 'The main chronicles of Oz. Explore, find clues, and survive the Red Country.',
    players: '1 Player',
    access: 'Free & Paid',
    status: 'Live',
    icon: <User className="w-8 h-8" />,
    color: 'emerald',
    href: '/campaign',
    premium: false
  },
  {
    id: 'bot',
    title: 'Bot Duel',
    desc: 'Quick turn-based battles against Oz-inspired AI bots. Practice your tactics.',
    players: '1 Player vs CPU',
    access: 'Free Limited / Paid Full',
    status: 'Beta',
    icon: <Cpu className="w-8 h-8" />,
    color: 'blue',
    href: '/play/bot',
    premium: false
  },
  {
    id: 'pvp',
    title: 'PvP Duel',
    desc: 'Battle other Pathwalkers in turn-based combat using your collected relics.',
    players: '2 Players',
    access: 'Paid Member',
    status: 'Coming Soon',
    icon: <Swords className="w-8 h-8" />,
    color: 'red',
    href: '/play/pvp',
    premium: true
  },
  {
    id: 'coop',
    title: 'Co-op Story Room',
    desc: 'Work together with a party to survive campaign sections and defeat bosses.',
    players: '2-4 Players',
    access: 'Paid Member',
    status: 'In Development',
    icon: <Users className="w-8 h-8" />,
    color: 'purple',
    href: '/play/coop',
    premium: true
  },
  {
    id: 'multiplayer_adventure',
    title: 'Multiplayer Adventure',
    desc: 'The ultimate board-style experience. Race, cooperate, or compete on a shared map.',
    players: '4-8 Players',
    access: 'Paid Member',
    status: 'Planning',
    icon: <Gamepad2 className="w-8 h-8" />,
    color: 'amber',
    href: '/play/adventure',
    premium: true
  }
];

export default function PlayHub() {
  const { user, profile } = useAuth();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const isPaid = hasPaidAccess(profile);
  const isOwner = isInternalUser(profile);

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="space-y-4 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <div className="h-px w-8 bg-primary/30" />
            <span className="text-[10px] uppercase font-black tracking-[0.6em] text-primary">Game Mode Selection</span>
            <div className="h-px w-8 bg-primary/30" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl text-white font-serif italic"
          >
            The Arena <span className="gold-gradient-text text-4xl md:text-6xl not-italic ml-2 font-black">&</span> Chronicles
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-zinc-500 font-serif italic text-lg leading-relaxed"
          >
            Choose your path across the Yellow Path. From solo survival to shared nightmares, your fate is in your cards.
          </motion.p>
        </header>

        {/* Game Mode Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MODES.map((mode, idx) => {
            const isLocked = mode.premium && !isPaid && !isOwner;
            const isHovered = hoveredMode === mode.id;

            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredMode(mode.id)}
                onMouseLeave={() => setHoveredMode(null)}
                className="relative group h-full"
              >
                <div className={cn(
                  "h-full glass-panel rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden transition-all duration-500 flex flex-col",
                  isHovered ? "border-primary/40 bg-zinc-950/40 -translate-y-2" : "grayscale-[0.5]",
                  isLocked && "opacity-80"
                )}>
                  {/* Mode Card Content */}
                  <div className="p-8 space-y-6 flex-1">
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 bg-zinc-900 transition-colors duration-500",
                        isHovered ? `text-white bg-zinc-800` : "text-zinc-500"
                      )}>
                        {mode.icon}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border",
                          mode.status === 'Live' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                          mode.status === 'Beta' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                          "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
                        )}>
                          {mode.status}
                        </span>
                        {mode.premium && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <Crown className="w-3 h-3 text-primary" />
                            <span className="text-[8px] text-primary font-black uppercase tracking-widest leading-none">Paid Access</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-3xl text-white font-serif italic leading-tight">{mode.title}</h3>
                      <p className="text-sm text-zinc-500 font-serif italic leading-relaxed">
                        {mode.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                       <div className="flex items-center gap-2">
                         <Users className="w-4 h-4 text-zinc-600" />
                         <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">{mode.players}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Lock className="w-4 h-4 text-zinc-600" />
                         <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">{mode.access}</span>
                       </div>
                    </div>
                  </div>

                  {/* Button Section */}
                  <div className="p-8 pt-0 mt-auto">
                    {isLocked ? (
                      <Link href="/membership" className="block w-full">
                        <button className="w-full glass-panel py-4 rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all flex items-center justify-center gap-3 group/btn">
                          <Crown className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-black tracking-widest">Upgrade to Unlock</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                      </Link>
                    ) : (
                      <Link href={mode.href} className="block w-full">
                        <button 
                          disabled={mode.status === 'Planning' || (mode.status === 'In Development' && !isOwner)}
                          className={cn(
                            "w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group/btn",
                            mode.status === 'Planning' || (mode.status === 'In Development' && !isOwner)
                              ? "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5"
                              : "premium-button premium-button-gold text-black"
                          )}
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span className="text-[10px] uppercase font-black tracking-widest">
                            {mode.status === 'Planning' ? 'Coming Soon' : 'Start Mode'}
                          </span>
                        </button>
                      </Link>
                    )}
                  </div>

                  {/* Hover Decor */}
                  <div className={cn(
                    "absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform duration-500",
                    isHovered ? "scale-x-100" : "scale-x-0"
                  )} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Guidance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="flex gap-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
             <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
               <History className="w-5 h-5 text-zinc-500" />
             </div>
             <div className="space-y-1">
               <p className="text-[9px] uppercase tracking-widest font-black text-zinc-400">Match History</p>
               <p className="text-[11px] text-zinc-600 font-serif italic">View your past duels and campaign triumphs.</p>
             </div>
          </div>
          <div className="flex gap-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
             <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
               <Settings className="w-5 h-5 text-zinc-500" />
             </div>
             <div className="space-y-1">
               <p className="text-[9px] uppercase tracking-widest font-black text-zinc-400">Arena Settings</p>
               <p className="text-[11px] text-zinc-600 font-serif italic">Toggle animations, quick-play mode, and privacy.</p>
             </div>
          </div>
          <div className="flex gap-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
             <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
               <Compass className="w-5 h-5 text-zinc-500" />
             </div>
             <div className="space-y-1">
               <p className="text-[9px] uppercase tracking-widest font-black text-zinc-400">Tutorial Center</p>
               <p className="text-[11px] text-zinc-600 font-serif italic">Learn the mechanics of turn-based Oz combat.</p>
             </div>
          </div>
        </motion.div>

        {isOwner && (
          <div className="fixed bottom-10 right-10 z-50">
            <Link href="/admin/multiplayer">
              <button className="bg-red-600 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-red-500 transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Multiplayer Admin
              </button>
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
