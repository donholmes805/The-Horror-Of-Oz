"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { BOOKS } from "@/constants/library";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Settings, Type, Share2, Lock, ArrowLeft, Scroll, Sparkles, User, ShieldCheck, Bookmark } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

const CHAPTER_DATA: Record<string, string> = {
  "ch-0": "The storm over the Emerald Wastes was not made of rain, but of the powdered remains of those who dared to walk the path before us. Dorothy stood at the edge of the precipice, her ash-stained cloak whipping in the gale. The Silver Slippers hummed with a resonance that felt more like a heartbeat than a piece of footwear. Behind her, the ruins of the Gale farm smoldered—a final offering to the entities that now claimed the sky. 'It has begun,' she whispered to the shadow at her feet. The Scarecrow did not answer; he was too busy stitching the mouths of the fallen shut with golden thread. Oz was no longer a dream. It was a harvest.\n\nEvery shadow in the Wastes seemed to stretch toward her, seeking the warmth of her fading innocence. The Lion was nowhere to be seen, likely cowering in the thickets of the Poisoned Poppy fields. But Dorothy didn't need a king. She needed a map. And the only map left was written in the blood of the Tin Woodsman.",
  "ch-1": "The ash was warm, almost comforting, as it settled into the creases of her skin. In the distance, the silhouette of the Emerald City flickered like a dying candle. The Marshals were moving now—great, clanking monstrosities of brass and bone, their eyes glowing with the baleful light of the Witch's soul. Dorothy gripped the hilt of the broken dagger. It had once belonged to a king of the Munchkins, a man who had traded his lungs for a single moment of silence. Now, it was her only companion in the gray. 'We move at dawn,' she said, though the sun had not risen in forty days.\n\nThe Yellow Brick Road beneath her was cracked, its vibrant hue faded to a sickly mustard. Where the bricks were missing, the earth was raw and bleeding. She remembered the stories her Aunt Em used to tell—of a land where the flowers sang and the water tasted like honey. But Aunt Em was gone now, her voice lost to the wind, her memories nothing but dust in the gears of the Great Oz.",
};

export default function ChapterReader() {
  const { bookId, chapterId } = useParams();
  const router = useRouter();
  const { user, profile, hasPaidAccess } = useAuth();
  
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("serif");
  const [showSettings, setShowSettings] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [chapterContent, setChapterContent] = useState("");
  const [loading, setLoading] = useState(true);

  const book = BOOKS.find(b => b.bookId === bookId);
  const isPaid = hasPaidAccess;
  
  const isFreeChapter = chapterId === "ch-0";

  useEffect(() => {
    async function loadContent() {
      if (!bookId || !chapterId) return;
      
      const snap = await getDoc(doc(db, "books", bookId as string, "chapters", chapterId as string));
      if (snap.exists()) {
        setChapterContent(snap.data().content);
      } else {
        setChapterContent(CHAPTER_DATA[chapterId as string] || "The records for this chapter appear to have been redacted or lost to the void.");
      }
      setLoading(false);
    }
    loadContent();
  }, [bookId, chapterId]);

  // Update Progress
  useEffect(() => {
    if (!user || !isPaid || loading) return;
    
    const markAsRead = async () => {
      try {
        const progressRef = doc(db, "playerProgress", user.uid);
        await updateDoc(progressRef, {
          [`libraryProgress.${bookId}.chapters.${chapterId}.status`]: "completed",
          [`libraryProgress.${bookId}.chapters.${chapterId}.lastRead`]: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to update reading progress:", err);
      }
    };

    const timer = setTimeout(markAsRead, 20000); // Mark complete after 20 seconds of reading
    return () => clearTimeout(timer);
  }, [user, isPaid, loading, bookId, chapterId]);

  if (!book || loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 font-serif text-amber-500 italic">
      <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      <p className="animate-pulse">Consulting the Archives...</p>
    </div>
  );

  return (
    <MainLayout>
      <div className={cn(
        "min-h-screen transition-all duration-1000",
        isReading ? "bg-zinc-950" : "bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)]"
      )}>
        {/* Reader Header */}
        <div className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5 transition-transform duration-500",
          isReading ? "-translate-y-full" : "translate-y-0"
        )}>
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => router.push(`/library/${bookId}`)}
                className="p-3 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="hidden md:block">
                <div className="flex items-center gap-2 text-[10px] text-amber-500/60 font-black uppercase tracking-widest mb-0.5">
                  <Scroll className="w-3 h-3" /> {book.title}
                </div>
                <h2 className="text-sm text-zinc-200 font-serif italic uppercase tracking-widest">Chapter {chapterId?.toString().replace("ch-", "")}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full border text-[10px] uppercase font-black tracking-widest transition-all",
                  showSettings ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"
                )}
              >
                <Type className="w-4 h-4" /> Appearance
              </button>
              <button 
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={cn(
                  "p-3 rounded-full border transition-all",
                  isBookmarked ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                )}
              >
                <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
              </button>
              <div className="h-8 w-px bg-white/10 mx-2" />
              <button 
                onClick={() => setIsReading(true)}
                className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2.5 rounded-full text-[10px] uppercase font-black tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                Immersive Mode
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel Overlay */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-8 z-[60] glass-panel p-6 border-white/10 w-72 space-y-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-500">
                  <span>Font Size</span>
                  <span className="text-amber-500">{fontSize}px</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5 transition-all text-sm">-</button>
                  <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg border border-white/5 transition-all text-sm">+</button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Typography</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setFontFamily("serif")}
                    className={cn(
                      "py-2.5 rounded-lg border text-sm transition-all font-serif",
                      fontFamily === "serif" ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-white/5 border-white/5 text-zinc-500"
                    )}
                  >
                    Antiqua
                  </button>
                  <button 
                    onClick={() => setFontFamily("sans")}
                    className={cn(
                      "py-2.5 rounded-lg border text-sm transition-all font-sans",
                      fontFamily === "sans" ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-white/5 border-white/5 text-zinc-500"
                    )}
                  >
                    Modern
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reader Content */}
        <div className="max-w-3xl mx-auto pt-48 pb-40 px-8 relative">
          
          {/* Immersive Trigger */}
          {isReading && (
            <button 
              onClick={() => setIsReading(false)}
              className="fixed bottom-8 right-8 z-[100] bg-black/40 hover:bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-full text-zinc-500 hover:text-white transition-all shadow-2xl"
              title="Exit Immersive Mode"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-12"
          >
            <div className="space-y-4 text-center mb-24">
              <div className="flex items-center justify-center gap-3 text-amber-500/40">
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-[0.4em]">Yellow Path Chronicles</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-6xl md:text-8xl text-white font-serif italic gold-gradient-text">
                {chapterId === "ch-0" ? "Prologue" : `Chapter ${chapterId?.toString().replace("ch-", "")}`}
              </h1>
              <div className="h-px w-24 bg-amber-500/20 mx-auto mt-8" />
            </div>

            {/* Content Area with Gating */}
            <div className="relative">
              {/* Personalized Watermark */}
              <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-around items-center opacity-[0.03] overflow-hidden">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="text-4xl font-black uppercase tracking-[2em] whitespace-nowrap rotate-[-25deg]">
                    LICENSED TO {profile?.displayName || user?.email || "PATHFINDER"} • {user?.uid.slice(0, 8)}
                  </div>
                ))}
              </div>

              <div 
                className={cn(
                  "leading-relaxed transition-all duration-700 relative z-10",
                  fontFamily === "serif" ? "font-serif italic" : "font-sans",
                  !isPaid && !isFreeChapter && "blur-xl select-none opacity-40 pointer-events-none"
                )}
                style={{ fontSize: `${fontSize}px`, color: "rgba(255, 255, 255, 0.85)" }}
              >
                {chapterContent.split("\n\n").map((para, i) => (
                  <p key={i} className="mb-10 text-justify indent-8 first-letter:text-4xl first-letter:text-amber-500 first-letter:mr-2 first-letter:float-left first-letter:leading-none first-letter:mt-1">
                    {para}
                  </p>
                ))}
              </div>

              {/* Paywall Overlay */}
              {!isPaid && !isFreeChapter && (
                <div className="absolute inset-0 flex items-center justify-center z-20 px-8 py-20">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-12 border-amber-500/20 text-center space-y-8 max-w-lg bg-black/60 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.9)]"
                  >
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20 shadow-[0_0_30px_rgba(251,191,36,0.1)]">
                      <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl text-white font-serif italic gold-gradient-text">Lore Restricted</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed italic">
                        The chronicles of the Yellow Path are reserved for those who have sworn the oath. Become a member to unlock the full nightmare.
                      </p>
                    </div>
                    <Link 
                      href="/dashboard"
                      className="premium-button block w-full py-5 text-[12px] uppercase font-black tracking-[0.3em] shadow-2xl"
                    >
                      Initiate Membership
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reader Footer / Nav */}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-8 transition-transform duration-500",
          isReading ? "translate-y-full" : "translate-y-0"
        )}>
          <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
            <button className="flex items-center gap-3 text-[10px] text-zinc-500 hover:text-white uppercase font-black tracking-widest transition-colors group">
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-white/5 group-hover:border-amber-500/50 transition-all">
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <span>Previous</span>
            </button>

            <div className="flex flex-col items-center gap-2">
               <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.4em] font-black text-amber-500/40">
                  <ShieldCheck className="w-3 h-3" /> Licensed Archive Access
               </div>
               <div className="text-[10px] text-zinc-600 font-serif italic">The Yellow Path • Book I</div>
            </div>

            <button className="flex items-center gap-3 text-[10px] text-zinc-500 hover:text-white uppercase font-black tracking-widest transition-colors group">
              <span>Next Chapter</span>
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-white/5 group-hover:border-amber-500/50 transition-all">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
