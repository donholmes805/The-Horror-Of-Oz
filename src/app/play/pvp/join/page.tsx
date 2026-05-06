"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  LogIn, 
  ArrowLeft, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { joinPvpRoom } from '../actions';

export default function JoinPvPPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !inviteCode || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await joinPvpRoom(user.uid, profile.username || 'Pathwalker', inviteCode);
      if (result.success && result.roomId) {
        router.push(`/play/room/${result.roomId}`);
      } else {
        setError(result.error || "Failed to join room.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        {/* Cinematic Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-radial-vignette opacity-60" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-panel p-10 md:p-16 text-center space-y-10 rounded-[3rem] border-primary/20 bg-zinc-950/80 relative z-10"
        >
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
               <LogIn className="w-8 h-8" />
            </div>
            <h1 className="text-4xl text-white font-serif italic">Join the Clash</h1>
            <p className="text-zinc-500 font-serif italic text-sm">
              Enter the encrypted invite code provided by your opponent.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
             <div className="space-y-2">
                <input 
                  type="text" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="OZ-XXXXX"
                  maxLength={8}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-center text-2xl font-black tracking-[0.2em] text-primary focus:outline-none focus:border-primary/50 transition-all placeholder:text-zinc-800"
                  required
                />
             </div>

             <button 
               type="submit"
               disabled={isProcessing || inviteCode.length < 4}
               className="w-full premium-button premium-button-gold py-5 rounded-2xl flex items-center justify-center gap-3"
             >
               {isProcessing ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
               ) : (
                 <>
                   <span className="text-[10px] uppercase font-black tracking-widest">Authorize Access</span>
                 </>
               )}
             </button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <Link href="/play/pvp" className="block pt-4">
            <button className="text-zinc-600 hover:text-white transition-colors flex items-center gap-3 mx-auto text-[10px] uppercase font-black tracking-widest">
               <ArrowLeft className="w-4 h-4" />
               Back to Hub
            </button>
          </Link>
        </motion.div>
      </div>
    </MainLayout>
  );
}
