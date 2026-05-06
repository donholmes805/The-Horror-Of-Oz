"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { BOOKS } from "@/constants/library";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Lock, ChevronRight, Play, CheckCircle, Sparkles, Scroll, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const CHAPTERS = [
  { id: "ch-0", title: "Prologue: Storm of Blood", paidOnly: false, duration: "8 min read" },
  { id: "ch-1", title: "Chapter 1: Awakening in Ash", paidOnly: true, duration: "12 min read" },
  { id: "ch-2", title: "Chapter 2: Patrol of the Marshal", paidOnly: true, duration: "15 min read" },
  { id: "ch-3", title: "Chapter 3: Blood on the Dunes", paidOnly: true, duration: "14 min read" },
  { id: "ch-4", title: "Chapter 4: Refuge in the Oil Derrick", paidOnly: true, duration: "18 min read" },
  { id: "ch-5", title: "Chapter 5: Rescue at Dusk", paidOnly: true, duration: "16 min read" },
];

export default function BookDetailPage() {
  const { bookId } = useParams();
  const router = useRouter();
  const { user, profile, hasPaidAccess } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const book = BOOKS.find(b => b.bookId === bookId);
  const isPaid = hasPaidAccess;

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "playerProgress", user.uid), (snap) => {
      if (snap.exists()) {
        setProgress(snap.data());
      }
    });
    return () => unsub();
  }, [user]);

  if (!book) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-serif italic text-amber-500">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
        <p>Searching the archives for this volume...</p>
      </div>
    </div>
  );

  const bookProgress = progress?.libraryProgress?.[book.bookId] || {};
  const readPercent = bookProgress.readPercent || 0;
  const listenPercent = bookProgress.listenPercent || 0;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        {/* Immersive Header Overlay */}
        <div className="absolute top-0 left-0 right-0 h-[60vh] opacity-20 pointer-events-none">
          <img src={book.coverImage} className="w-full h-full object-cover blur-3xl scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>

        <div className="p-8 max-w-6xl mx-auto space-y-16 relative z-10 pt-16">
          
          {/* Back Navigation */}
          <button 
            onClick={() => router.push("/library")}
            className="group flex items-center gap-3 text-zinc-500 hover:text-amber-500 transition-colors w-fit"
          >
            <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-black/40 backdrop-blur-xl group-hover:border-amber-500/50 transition-all">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest">Return to Archives</span>
          </button>

          {/* Book Hero section */}
          <div className="flex flex-col lg:flex-row gap-20 items-center lg:items-start">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-[320px] lg:w-2/5 relative group"
            >
              <div className="absolute -inset-4 bg-amber-500/10 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative aspect-[2/3] glass-panel p-2 border-white/10 group-hover:border-amber-500/30 transition-all duration-700 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-[2rem]">
                <img 
                  src={book.coverImage} 
                  className="w-full h-full object-cover rounded-[1.5rem] group-hover:scale-105 transition-transform duration-1000" 
                  alt={book.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>
            </motion.div>
            
            <div className="flex-1 space-y-10 py-4 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <span className="bg-amber-500/10 text-amber-500 text-[10px] uppercase font-black tracking-[0.3em] px-4 py-1.5 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                    Volume {book.bookNumber}
                  </span>
                  <div className="h-px w-24 bg-gradient-to-r from-amber-500/20 to-transparent hidden lg:block" />
                </div>
                <h1 className="text-6xl md:text-8xl text-white font-serif italic tracking-tighter leading-none gold-gradient-text">
                  {book.title}
                </h1>
                <p className="text-amber-500/60 text-base uppercase tracking-[0.4em] font-bold">{book.subtitle}</p>
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-zinc-400 text-xl italic font-serif leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                "{book.description}"
              </motion.p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto lg:mx-0">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-panel p-8 border-white/5 space-y-4 bg-zinc-950/40"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5 text-zinc-400">
                      <BookOpen className="w-4 h-4 text-amber-500/60" />
                      <span className="text-[10px] uppercase font-black tracking-widest">Reading Progress</span>
                    </div>
                    <span className="text-2xl text-white font-serif italic">{readPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-1000" 
                      style={{ width: `${readPercent}%` }}
                    />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass-panel p-8 border-white/5 space-y-4 bg-zinc-950/40"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5 text-zinc-400">
                      <Headphones className="w-4 h-4 text-red-500/60" />
                      <span className="text-[10px] uppercase font-black tracking-widest">Audio Progress</span>
                    </div>
                    <span className="text-2xl text-white font-serif italic">{listenPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-1000" 
                      style={{ width: `${listenPercent}%` }}
                    />
                  </div>
                </motion.div>
              </div>

              <div className="flex flex-wrap gap-4 pt-6 justify-center lg:justify-start">
                <Link 
                  href={`/library/${book.bookId}/chapter/ch-0`}
                  className="premium-button px-12 py-5 flex items-center gap-4 text-[12px] uppercase font-black tracking-[0.2em] group"
                >
                  Continue Reading <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href={`/library/${book.bookId}/audio/ch-0`}
                  className="glass-panel hover:bg-white/5 border-white/10 px-12 py-5 flex items-center gap-4 text-[12px] uppercase font-black tracking-[0.2em] text-zinc-400 hover:text-white transition-all group"
                >
                  Resume Audio <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Chapter List */}
          <div className="space-y-10 pt-16 border-t border-white/5">
            <div className="flex items-center gap-8">
              <h2 className="text-4xl text-white font-serif italic gold-gradient-text">Chapters</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent" />
              {!isPaid && (
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black hidden md:block">
                  Membership required for full access
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              {CHAPTERS.map((chapter, idx) => {
                const isChapterPaidOnly = chapter.paidOnly && !isPaid;
                const chapterProgress = progress?.libraryProgress?.[book.bookId]?.chapters?.[chapter.id] || {};
                const isRead = chapterProgress.status === "completed";
                const isAudioFinished = chapterProgress.audioStatus === "completed";

                return (
                  <motion.div 
                    key={chapter.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div
                      className={cn(
                        "glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between group transition-all border-white/5 relative overflow-hidden",
                        isChapterPaidOnly ? "bg-zinc-950/20" : "hover:border-amber-500/30 hover:bg-white/[0.02]"
                      )}
                    >
                      {isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500/50" />
                      )}

                      <div className="flex items-center gap-8 mb-6 md:mb-0">
                        <span className="text-xs text-zinc-600 font-black w-8 group-hover:text-amber-500 transition-colors tabular-nums">
                          {idx === 0 ? "PRL" : idx.toString().padStart(2, "0")}
                        </span>
                        <div className="space-y-1.5">
                          <h4 className="text-2xl text-zinc-200 font-serif italic group-hover:text-white transition-colors flex items-center gap-3">
                            {chapter.title}
                            {isRead && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </h4>
                          <div className="flex items-center gap-4">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> {chapter.duration}
                            </p>
                            {isChapterPaidOnly && (
                              <span className="text-[8px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-black uppercase tracking-widest">
                                Paid Only
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 md:gap-6 self-end md:self-auto">
                        {isChapterPaidOnly ? (
                          <Link 
                            href="/dashboard"
                            className="flex items-center gap-2.5 text-[10px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/5 px-6 py-2.5 rounded-full border border-amber-500/20 hover:bg-amber-500/10 transition-colors shadow-inner"
                          >
                            <Lock className="w-3.5 h-3.5" /> Upgrade Access
                          </Link>
                        ) : (
                          <div className="flex gap-3">
                            <Link
                              href={`/library/${book.bookId}/chapter/${chapter.id}`}
                              className="p-4 rounded-2xl bg-white/5 text-zinc-400 hover:bg-amber-500/10 hover:text-amber-500 transition-all group/icon relative"
                              title="Read Chapter"
                            >
                              <BookOpen className="w-5 h-5" />
                              {isRead && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />}
                            </Link>
                            <Link
                              href={`/library/${book.bookId}/audio/${chapter.id}`}
                              className="p-4 rounded-2xl bg-white/5 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all group/icon relative"
                              title="Listen to Audiobook"
                            >
                              <Headphones className="w-5 h-5" />
                              {isAudioFinished && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

