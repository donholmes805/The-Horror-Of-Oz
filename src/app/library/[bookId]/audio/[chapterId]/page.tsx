"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { BOOKS } from "@/constants/library";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Settings, 
  Lock,
  Headphones,
  Timer,
  Share2,
  ListMusic
} from "lucide-react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export default function AudiobookPage() {
  const { bookId, chapterId } = useParams();
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<any>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
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
          audioUrl: "https://example.com/audio.mp3",
        });
      }
      setLoading(false);
    }
    fetchChapter();
  }, [bookId, chapterId]);

  const togglePlay = () => {
    if (!isPaid) return;
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setProgress((current / dur) * 100);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
      <p className="font-serif italic text-red-500/60 animate-pulse">Loading the Narrations...</p>
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a0505_0%,_#000_100%)] opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
          
          {/* Left: Cover Art & Visualizer */}
          <div className="space-y-8">
            <button 
              onClick={() => router.back()} 
              className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] uppercase font-black tracking-widest">Back to Chapter</span>
            </button>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square glass-panel p-4 border-white/10 shadow-[0_0_100px_rgba(239,68,68,0.1)] group overflow-hidden rounded-[2.5rem]"
            >
              <img 
                src={book?.coverImage} 
                className="w-full h-full object-cover rounded-[1.5rem] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" 
                alt="Cover" 
              />
              
              {/* Audio Visualizer Layer */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex gap-1.5 items-end h-24 mb-12"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div 
                          key={i}
                          animate={{ height: ["10%", "100%", "20%", "80%", "10%"] }}
                          transition={{ 
                            duration: 0.8 + Math.random(), 
                            repeat: Infinity, 
                            delay: i * 0.1 
                          }}
                          className="w-1.5 bg-gradient-to-t from-red-600 to-amber-500 rounded-full"
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="space-y-2">
                  <h2 className="text-4xl text-white font-serif italic drop-shadow-2xl">{chapter?.title}</h2>
                  <div className="flex items-center justify-center gap-2 text-red-500/60 font-serif italic text-sm">
                    <Headphones className="w-4 h-4" />
                    <span>Narrated by Don E. Holmes III</span>
                  </div>
                </div>
              </div>

              {!isPaid && (
                <div className="absolute inset-0 backdrop-blur-3xl bg-black/40 flex items-center justify-center p-12">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 text-center space-y-6 border-red-500/20"
                  >
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                      <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl text-white font-serif italic">Audiobook Restricted</h3>
                      <p className="text-[11px] text-zinc-400 leading-relaxed uppercase tracking-widest font-black">Membership Required</p>
                    </div>
                    <Link href="/dashboard" className="premium-button w-full py-3 text-[10px] block font-black uppercase tracking-[0.2em]">Become a Member</Link>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Info & Controls */}
          <div className="flex flex-col justify-center space-y-12">
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.5em] font-black text-amber-500/60">{book?.title}</span>
              <h3 className="text-3xl text-zinc-200 font-serif italic">Book I: Blood on the Yellow Brick</h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
                Experience the horror in high-fidelity. Listen to every chapter as it was meant to be told.
              </p>
            </div>

            <div className="space-y-8">
              {/* Progress Slider */}
              <div className="space-y-4">
                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer group">
                  <div className="absolute inset-0 bg-white/5" />
                  <motion.div 
                    className="absolute h-full bg-gradient-to-r from-red-600 to-amber-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 font-black tracking-widest">
                  <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                  <span>{formatTime(audioRef.current?.duration || 0)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <button className="p-3 text-zinc-500 hover:text-white transition-colors">
                    <SkipBack className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-black hover:scale-105 transition-all shadow-[0_0_50px_rgba(239,68,68,0.3)] active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                  </button>
                  <button className="p-3 text-zinc-500 hover:text-white transition-colors">
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex gap-4">
                  <button className="p-4 rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-4 rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                    <ListMusic className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Secondary Controls */}
              <div className="flex items-center justify-between px-6 py-4 glass-panel border-white/5 rounded-2xl bg-white/[0.02]">
                <button 
                  onClick={() => setPlaybackSpeed(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1)} 
                  className="text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                >
                  <Timer className="w-4 h-4" /> Speed: {playbackSpeed}x
                </button>
                <div className="flex items-center gap-4">
                  <Volume2 className="w-4 h-4 text-zinc-500" />
                  <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-500 w-3/4" />
                  </div>
                </div>
                <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef}
          src={isPaid ? chapter?.audioUrl : ""}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </MainLayout>
  );
}
