"use client";

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Users, Lock, Crown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CoopPlaceholder() {
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full glass-panel p-12 md:p-20 text-center space-y-8 rounded-[3rem] border-primary/20 bg-zinc-950/50"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150" />
            <Users className="w-20 h-20 text-primary mx-auto relative z-10 drop-shadow-[0_0_20px_rgba(200,155,44,0.4)]" />
          </div>

          <div className="space-y-4 relative z-10">
            <h1 className="text-5xl text-white font-serif italic">Co-op Story Room</h1>
            <div className="flex items-center justify-center gap-3">
               <div className="h-px w-8 bg-primary/20" />
               <span className="text-[10px] uppercase font-black tracking-[0.4em] text-primary">Future Engagement</span>
               <div className="h-px w-8 bg-primary/20" />
            </div>
            <p className="text-lg text-zinc-500 font-serif italic leading-relaxed">
              No Pathwalker should walk the Yellow Road alone. We are finalizing the party synchronization system 
              to allow 2-4 players to explore the Red Country together.
            </p>
          </div>

          <div className="pt-8 space-y-4">
             <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-primary font-black uppercase tracking-widest">Paid Membership Required</span>
             </div>
             
             <Link href="/play" className="block pt-4">
                <button className="premium-button premium-button-gold px-10 py-4 rounded-2xl flex items-center gap-3 mx-auto">
                   <ArrowLeft className="w-4 h-4" />
                   <span className="text-[10px] uppercase font-black tracking-widest">Return to Hub</span>
                </button>
             </Link>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
