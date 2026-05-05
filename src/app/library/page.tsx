"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { BOOKS } from "@/constants/library";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Lock, Sparkles, Scroll, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function LibraryHome() {
  const { user, profile } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const isPaid = profile?.membershipStatus === "paid" || profile?.membershipStatus === "admin" || profile?.membershipStatus === "owner";

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "playerProgress", user.uid), (snap) => {
      if (snap.exists()) {
        setProgress(snap.data());
      }
    });
    return () => unsub();
  }, [user]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        <div className="p-8 max-w-7xl mx-auto space-y-20">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto space-y-8 pt-20 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center gap-6 relative">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 text-amber-500/60 bg-amber-500/5 px-6 py-2 rounded-full border border-amber-500/10 backdrop-blur-xl"
                >
                  <Scroll className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-[0.5em] font-black">The Archives of Oz</span>
                </motion.div>
                <h1 className="font-serif text-6xl md:text-8xl gold-gradient-text italic tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                  Forbidden Library
                </h1>
                <div className="h-px w-48 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              </div>
              
              <p className="text-zinc-400 text-xl font-serif italic max-w-2xl mx-auto leading-relaxed">
                Read the chronicles. Hear the nightmare. Unlock the story behind the Yellow Path. Every word is a contract. Every story is a scar.
              </p>
            </motion.div>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {BOOKS.length > 0 ? BOOKS.map((book, index) => {
              const bookProgress = progress?.libraryProgress?.[book.bookId] || {};
              const readPercent = bookProgress.readPercent || 0;
              const listenPercent = bookProgress.listenPercent || 0;
              const isLocked = book.status === "coming-soon";
              const isPaidOnly = book.paidOnly && !isPaid;

              return (
                <motion.div
                  key={book.bookId}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  className="group relative"
                >
                  {/* Premium Glow Effect */}
                  <div className="absolute -inset-4 bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-[3rem]" />
                  
                  <div className={cn(
                    "glass-panel overflow-hidden relative flex flex-col h-full border-white/5 group-hover:border-amber-500/30 transition-all duration-500",
                    !isLocked && "hover:translate-y-[-8px]"
                  )}>
                    {/* Cover Area */}
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img 
                        src={book.coverImage} 
                        alt={book.title}
                        className={cn(
                          "w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out",
                          (isLocked || isPaidOnly) ? "opacity-40 grayscale" : "opacity-80 group-hover:opacity-100"
                        )}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                      
                      {/* Status Badges */}
                      <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                        {isLocked ? (
                          <div className="bg-black/80 backdrop-blur-2xl px-4 py-2 border border-white/10 rounded-full flex items-center gap-2 shadow-2xl">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Coming Soon</span>
                          </div>
                        ) : isPaidOnly ? (
                          <div className="bg-amber-500/10 backdrop-blur-2xl px-4 py-2 border border-amber-500/20 rounded-full flex items-center gap-2 shadow-2xl">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Paid Member</span>
                          </div>
                        ) : (
                          <div className="bg-green-500/10 backdrop-blur-2xl px-4 py-2 border border-green-500/20 rounded-full flex items-center gap-2 shadow-2xl">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">Available</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute bottom-8 left-8 right-8 space-y-3">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500/80" />
                          <span className="text-[10px] text-amber-500/80 font-black uppercase tracking-[0.4em]">Volume {book.bookNumber}</span>
                        </div>
                        <h3 className="text-4xl text-white font-serif italic group-hover:gold-gradient-text transition-all duration-300 drop-shadow-2xl leading-tight">
                          {book.title}
                        </h3>
                      </div>
                    </div>

                    {/* Info Area */}
                    <div className="p-8 flex-1 flex flex-col bg-zinc-950/40 backdrop-blur-md">
                      <p className="text-sm text-zinc-400 mb-8 line-clamp-3 italic font-serif leading-relaxed">
                        "{book.description}"
                      </p>
                      
                      {/* Progress Bars */}
                      {!isLocked && (
                        <div className="grid grid-cols-2 gap-6 mb-8">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-black text-zinc-500">
                              <span>Read</span>
                              <span className="text-amber-500">{readPercent}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-1000" 
                                style={{ width: `${readPercent}%` }} 
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-black text-zinc-500">
                              <span>Listen</span>
                              <span className="text-red-500">{listenPercent}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] transition-all duration-1000" 
                                style={{ width: `${listenPercent}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-auto space-y-4">
                        {isLocked ? (
                          <div className="w-full bg-zinc-900/40 text-zinc-600 border border-white/5 py-4 text-[10px] uppercase tracking-[0.4em] font-black text-center rounded-2xl backdrop-blur-sm">
                            Locked in the Void
                          </div>
                        ) : isPaidOnly ? (
                          <Link 
                            href="/dashboard"
                            className="w-full bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 border border-amber-500/20 py-4 text-[10px] uppercase tracking-[0.4em] font-black text-center rounded-2xl transition-all block"
                          >
                            Upgrade to Access
                          </Link>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <Link 
                              href={`/library/${book.bookId}`} 
                              className="premium-button py-4 text-[9px] flex items-center justify-center gap-2 uppercase tracking-[0.2em] font-black group/btn"
                            >
                              Read Lore <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                            <Link 
                              href={`/library/${book.bookId}/audio/ch-0`} 
                              className="glass-panel hover:bg-white/5 py-4 text-[9px] flex items-center justify-center gap-2 uppercase tracking-[0.2em] font-black text-zinc-400 hover:text-white transition-all border-white/10"
                            >
                              Listen <Headphones className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="col-span-full py-32 text-center space-y-6">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-white/5 opacity-50">
                  <Scroll className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-3xl text-zinc-500 font-serif italic">The archive has not been opened yet.</h3>
              </div>
            )}
          </div>

          {/* Membership Value Messaging */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center space-y-4 pt-12 border-t border-white/5"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-amber-500/40">Initiate Membership</p>
            <p className="text-sm text-zinc-500 italic leading-relaxed">
              Paid members can read every available chapter, listen to audiobook chapters, bookmark progress, and resume where they left off.
            </p>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}

