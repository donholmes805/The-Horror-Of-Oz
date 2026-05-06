"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Lock, 
  Crown, 
  ArrowLeft, 
  Plus, 
  LogIn, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createPvpRoom } from './actions';
import { cn } from '@/lib/utils';

export default function PvPPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPaid = profile?.membershipStatus === 'paid' || profile?.role === 'owner' || profile?.role === 'admin' || profile?.isInternal;

  const handleCreateRoom = async () => {
    if (!user || !profile || isProcessing) return;
    if (!isPaid) {
      setError("Paid Membership required to host PvP duels.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await createPvpRoom(user.uid, profile.username || 'Pathwalker');
      if (result.success && result.roomId) {
        router.push(`/play/room/${result.roomId}`);
      } else {
        setError(result.error || "Failed to create room.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center p-6 pt-24 md:pt-32">
        {/* Cinematic Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-radial-vignette opacity-60" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-red-900/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl w-full glass-panel p-8 md:p-16 text-center space-y-12 rounded-[3rem] border-primary/20 bg-zinc-950/80 relative z-10"
        >
          <div className="space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150" />
              <Swords className="w-20 h-20 text-primary mx-auto relative z-10 drop-shadow-[0_0_20px_rgba(200,155,44,0.4)]" />
            </div>

            <div className="space-y-3">
              <h1 className="text-5xl md:text-7xl text-white font-serif italic">Duel Arena</h1>
              <div className="flex items-center justify-center gap-3">
                 <div className="h-px w-8 bg-primary/20" />
                 <span className="text-[10px] uppercase font-black tracking-[0.4em] text-primary">Private PvP Beta</span>
                 <div className="h-px w-8 bg-primary/20" />
              </div>
              <p className="text-zinc-500 font-serif italic text-lg max-w-xl mx-auto">
                Step into the simulation. Challenge fellow Pathwalkers to tactical combat. 
                Honor is forged in the clash of relics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
             {/* Create Room Card */}
             <div className={cn(
               "glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-6 flex flex-col items-center group transition-all",
               isPaid ? "hover:border-primary/40" : "opacity-60"
             )}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                   <Plus className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl text-white font-serif italic">Create Room</h3>
                  <p className="text-xs text-zinc-500 font-serif italic">Host a private session and invite a rival with a code.</p>
                </div>
                
                <button 
                  onClick={handleCreateRoom}
                  disabled={isProcessing}
                  className={cn(
                    "w-full py-4 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                    isPaid ? "premium-button premium-button-gold" : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                  )}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Initiate Protocol"}
                </button>
             </div>

             {/* Join Room Card */}
             <div className={cn(
               "glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-6 flex flex-col items-center group transition-all",
               isPaid ? "hover:border-primary/40" : "opacity-60"
             )}>
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                   <LogIn className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl text-white font-serif italic">Join Room</h3>
                  <p className="text-xs text-zinc-500 font-serif italic">Enter an invite code to join a Pathwalker's session.</p>
                </div>
                
                <Link href="/play/pvp/join" className="w-full">
                  <button 
                    disabled={!isPaid}
                    className={cn(
                      "w-full py-4 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                      isPaid ? "bg-white/5 hover:bg-white/10 border border-white/10 text-white" : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                    )}
                  >
                    Enter Code
                  </button>
                </Link>
             </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-serif italic"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <div className="pt-8 space-y-6 border-t border-white/5">
             {!isPaid && (
               <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="text-[10px] text-primary font-black uppercase tracking-widest">Paid Membership Required for Arena Access</span>
               </div>
             )}
             
             <Link href="/play" className="block">
                <button className="text-zinc-500 hover:text-white transition-colors flex items-center gap-3 mx-auto text-[10px] uppercase font-black tracking-widest">
                   <ArrowLeft className="w-4 h-4" />
                   Back to Hub
                </button>
             </Link>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
