"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { BOOKS } from "@/constants/library";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bookmark, Settings, ChevronLeft, ChevronRight, Lock, Type, Moon, Sun, Sparkles } from "lucide-react";
import Link from "next/link";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export default function ReaderPage() {
  const { bookId, chapterId } = useParams();
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(20); // Base font size
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const book = BOOKS.find(b => b.bookId === bookId);
  const isPaid = profile?.membershipStatus === "paid" || profile?.membershipStatus === "admin" || profile?.membershipStatus === "owner";

  useEffect(() => {
    async function fetchChapter() {
      if (!bookId || !chapterId) return;
      
      const snap = await getDoc(doc(db, "books", bookId as string, "chapters", chapterId as string));
      if (snap.exists()) {
        setChapter(snap.data());
      } else {
        setChapter({
          title: "Chapter 1: Awakening in Ash",
          content: "The ash was everywhere. It filled her lungs and coated her skin in a fine, grey powder. Dorothy looked back at the ruins of her home, the farmhouse splintered like matchsticks by the force of the cyclone. But this was no Kansas storm. The air smelled of burnt oil and old magic. The path ahead was not gold, but a scorched, yellow brick road that bled red where the earth was broken...\n\nShe took a step, her boots crunching on the brittle yellow clay. The sky was a bruised purple, lightning flickering behind heavy, oily clouds. There was a sound in the distance—not the whistle of the wind, but the rhythmic clanking of metal on metal. A heartbeat made of steam and steel.\n\n\"Toto?\" she whispered, but the dog was gone. In his place, only a small silver collar lay in the dust, its nameplate scorched beyond recognition. The Horror of Oz had begun.",
          paidOnly: true
        });
      }
      setLoading(false);
    }
    fetchChapter();
  }, [bookId, chapterId]);

  const handleScroll = (e: any) => {
    if (!user) return;
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const percent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    
    // Save progress periodically
    if (percent > 0 && percent % 10 === 0) {
      // In a real app, you'd throttle this
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      <p className="font-serif italic text-amber-500/60 animate-pulse">Consulting the Archives...</p>
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#050505] text-[#d4d4d8] selection:bg-amber-500/30">
        
        {/* Immersive Header */}
        <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => router.back()} 
                className="p-2 -ml-2 text-zinc-500 hover:text-amber-500 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="h-8 w-px bg-white/10 hidden md:block" />
              <div className="hidden md:block">
                <h1 className="text-[10px] uppercase tracking-[0.4em] font-black text-amber-500/60 mb-0.5">{book?.title}</h1>
                <p className="text-sm font-serif italic text-white line-clamp-1">{chapter?.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 text-zinc-500 hover:text-amber-500 transition-colors"
              >
                <Type className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={cn(
                  "p-3 transition-all",
                  isBookmarked ? "text-amber-500" : "text-zinc-500 hover:text-amber-500"
                )}
              >
                <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
              </button>
            </div>
          </div>

          {/* Settings Dropdown */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-6 top-full mt-2 w-64 glass-panel p-6 border-white/10 shadow-2xl z-50"
              >
                <div className="space-y-6">
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Font Size</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setFontSize(Math.max(16, fontSize - 2))} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">-</button>
                      <span className="text-sm font-serif">{fontSize}px</span>
                      <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">+</button>
                    </div>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Theme</span>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#050505] border border-amber-500/50" />
                      <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-white/10" />
                      <div className="w-6 h-6 rounded-full bg-[#2c241a] border border-white/10" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Reader Content Area */}
        <main 
          className="max-w-3xl mx-auto px-6 py-24 min-h-screen relative"
          onScroll={handleScroll}
        >
          {/* Chapter Title in Content */}
          <div className="text-center space-y-4 mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <span className="text-[10px] uppercase font-black tracking-[0.6em] text-amber-500/40">The Yellow Path Chronicles</span>
              <h2 className="text-4xl md:text-6xl text-white font-serif italic gold-gradient-text">{chapter?.title}</h2>
              <div className="flex items-center justify-center gap-4 py-6">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/30" />
                <Sparkles className="w-4 h-4 text-amber-500/20" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/30" />
              </div>
            </motion.div>
          </div>

          {!isPaid && chapter?.paidOnly !== false ? (
            <div className="relative">
              <div className="space-y-10 opacity-10 blur-sm pointer-events-none select-none font-serif italic leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                {chapter?.content.split("\n\n").map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              
              <div className="absolute inset-0 flex items-start justify-center pt-20">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-panel p-12 max-w-md w-full text-center space-y-8 shadow-[0_0_100px_rgba(251,191,36,0.15)] border-amber-500/20"
                >
                  <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                    <Lock className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl text-white font-serif italic">Lore Restricted</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      The full chronicles of Book I are reserved for initiated members of the Order. Upgrade your status to unlock the Forbidden Library.
                    </p>
                  </div>
                  <Link 
                    href="/dashboard" // Link to membership upgrade
                    className="premium-button w-full py-4 text-[11px] uppercase font-black tracking-widest block"
                  >
                    Unlock Full Library
                  </Link>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Membership includes Audiobooks & Trading Perks</p>
                </motion.div>
              </div>
            </div>
          ) : (
            <motion.article 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="font-serif italic leading-relaxed space-y-12 relative"
              style={{ fontSize: `${fontSize}px` }}
            >
              {/* Dynamic Watermark */}
              <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] select-none rotate-12 -z-10">
                <p className="text-9xl font-black uppercase tracking-[0.5em] text-white">
                  {profile?.username || user?.email?.split('@')[0] || "PROTOTYPE"}
                </p>
              </div>

              {chapter?.content.split("\n\n").map((para: string, i: number) => (
                <p key={i} className="first-letter:text-5xl first-letter:text-amber-500 first-letter:mr-2 first-letter:float-left first-letter:leading-none first-letter:mt-1">
                  {para}
                </p>
              ))}

              {/* Navigation Footer */}
              <div className="pt-32 pb-24 space-y-12">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
                  <button className="group flex flex-col items-start gap-2 text-zinc-500 hover:text-amber-500 transition-colors text-left">
                    <span className="text-[9px] uppercase tracking-widest font-black flex items-center gap-2">
                      <ChevronLeft className="w-3 h-3" /> Previous Chapter
                    </span>
                    <span className="text-lg font-serif italic line-clamp-1">The Shadow of the Cyclone</span>
                  </button>
                  <button className="group flex flex-col items-end gap-2 text-amber-500 hover:text-white transition-colors text-right">
                    <span className="text-[9px] uppercase tracking-widest font-black flex items-center gap-2">
                      Next Chapter <ChevronRight className="w-3 h-3" />
                    </span>
                    <span className="text-lg font-serif italic line-clamp-1">Chapter 2: Patrol of the Marshal</span>
                  </button>
                </div>

                <div className="text-center pt-24 pb-8 space-y-2">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-[0.6em] font-black italic">
                    Written by Don E. Holmes III
                  </p>
                  <p className="text-[8px] text-zinc-700 uppercase tracking-[0.3em] font-black">
                    © {new Date().getFullYear()} All Rights Reserved. The Horror of Oz.
                  </p>
                </div>
              </div>
            </motion.article>
          )}
        </main>
      </div>
    </MainLayout>
  );
}
