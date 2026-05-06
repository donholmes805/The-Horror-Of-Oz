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
  ListMusic,
  Maximize2,
  Info
} from "lucide-react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export default function AudiobookPage() {
  const { bookId, chapterId } = useParams();
  const { user, profile, hasPaidAccess } = useAuth();
  const router = useRouter();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<any>(null);
  const [volume, setVolume] = useState(0.8);

  const audioRef = useRef<HTMLAudioElement>(null);
  const book = BOOKS.find(b => b.bookId === bookId);
  const isPaid = hasPaidAccess;

  useEffect(() => {
    async function fetchChapter() {
      if (!bookId || !chapterId) return;
      const snap = await getDoc(doc(db, "books", bookId as string, "chapters", chapterId as string));
      if (snap.exists()) {
        setChapter(snap.data());
      } else {
        // Fallback for demo
        setChapter({
          title: chapterId === "ch-0" ? "Prologue: Storm of Blood" : "Chapter 1: Awakening in Ash",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        });
      }
      setLoading(false);
    }
    fetchChapter();
  }, [bookId, chapterId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
      if (dur) {
        setProgress((current / dur) * 100);
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const skip = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
      <p className="font-serif italic text-red-500/60 animate-pulse">Summoning Narrations...</p>
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Cinematic Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a0505_0%,_#000_100%)] opacity-80" />
        <div className="absolute top-0 left-0 right-0 h-[60vh] opacity-20 pointer-events-none">
          <img src={book?.coverImage} className="w-full h-full object-cover blur-[100px] scale-150" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative z-10 items-center">
          
          {/* Left: Premium Cover Art & Interactive Visualizer */}
          <div className="space-y-8 flex flex-col items-center lg:items-start">
            <button 
              onClick={() => router.push(`/library/${bookId}`)} 
              className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-all bg-white/5 px-6 py-3 rounded-full border border-white/5 hover:border-white/20"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] uppercase font-black tracking-widest">Return to Chapter</span>
            </button>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative aspect-square w-full max-w-[480px] glass-panel p-4 border-white/10 shadow-[0_0_120px_rgba(239,68,68,0.15)] group overflow-hidden rounded-[3rem]"
            >
              <img 
                src={book?.coverImage} 
                className={cn(
                  "w-full h-full object-cover rounded-[2.5rem] transition-all duration-[2000ms] ease-out",
                  isPlaying ? "scale-110 opacity-60" : "scale-100 opacity-30"
                )} 
                alt="Cover" 
              />
              
              {/* Visualizer Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-t from-black/80 via-transparent to-transparent">
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex gap-2 items-end h-32 mb-16"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                        <motion.div 
                          key={i}
                          animate={{ height: ["10%", "100%", "30%", "90%", "20%", "70%", "10%"] }}
                          transition={{ 
                            duration: 0.6 + (i * 0.1), 
                            repeat: Infinity, 
                            ease: "easeInOut"
                          }}
                          className="w-2 bg-gradient-to-t from-red-600 via-red-500 to-amber-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                     <div className="h-px w-8 bg-red-500/30" />
                     <Headphones className="w-5 h-5 text-red-500/60" />
                     <div className="h-px w-8 bg-red-500/30" />
                  </div>
                  <h2 className="text-4xl md:text-5xl text-white font-serif italic drop-shadow-[0_0_20px_rgba(0,0,0,1)] leading-tight">
                    {chapter?.title}
                  </h2>
                  <p className="text-zinc-400 text-sm font-serif italic opacity-60">Narrated by Don E. Holmes III</p>
                </div>
              </div>

              {/* Gating Overlay */}
              {!isPaid && (
                <div className="absolute inset-0 backdrop-blur-3xl bg-black/60 flex items-center justify-center p-8 z-20">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-10 text-center space-y-8 border-red-500/30 bg-black/40 shadow-2xl"
                  >
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                      <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl text-white font-serif italic gold-gradient-text">Voices of the Void</h3>
                      <p className="text-[11px] text-zinc-400 leading-relaxed uppercase tracking-[0.2em] font-black italic">
                        Experience the nightmare in full fidelity. Become a member to unlock audiobook narrations.
                      </p>
                    </div>
                    <Link 
                      href="/dashboard" 
                      className="premium-button w-full py-5 text-[11px] block font-black uppercase tracking-[0.3em] shadow-2xl"
                    >
                      Initiate Membership
                    </Link>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Immersive Player Controls */}
          <div className="flex flex-col justify-center space-y-12 py-8">
            <div className="space-y-4 text-center lg:text-left">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <span className="text-[11px] uppercase tracking-[0.6em] font-black text-amber-500/50">Audiobook Experience</span>
                <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent hidden lg:block" />
              </div>
              <h3 className="text-4xl text-zinc-100 font-serif italic tracking-tight">{book?.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed italic font-serif max-w-sm mx-auto lg:mx-0">
                "Every breath of the narrator carries the weight of the Emerald Wastes. Listen closely, for the fog has ears."
              </p>
            </div>

            <div className="space-y-10">
              {/* Progress System */}
              <div className="space-y-6">
                <div className="relative pt-4">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onChange={handleProgressChange}
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-red-600 hover:accent-red-500 transition-all outline-none"
                    style={{
                      background: `linear-gradient(to right, #dc2626 ${progress}%, rgba(255,255,255,0.05) ${progress}%)`
                    }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] pointer-events-none transition-all duration-75"
                    style={{ left: `calc(${progress}% - 8px)` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 font-black tracking-[0.2em] tabular-nums">
                  <span className="flex items-center gap-2">
                    <Play className="w-3 h-3 fill-current opacity-40" /> {formatTime(audioRef.current?.currentTime || 0)}
                  </span>
                  <span className="flex items-center gap-2">
                    {formatTime(audioRef.current?.duration || 0)} <Maximize2 className="w-3 h-3 opacity-40" />
                  </span>
                </div>
              </div>

              {/* Main Playback Cluster */}
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <button 
                    onClick={() => skip(-15)}
                    className="p-4 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-2xl border border-white/5 hover:border-white/10"
                    title="Skip Back 15s"
                  >
                    <SkipBack className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-amber-700 flex items-center justify-center text-white hover:scale-105 transition-all shadow-[0_0_80px_rgba(220,38,38,0.3)] active:scale-95 group relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    {isPlaying ? (
                      <Pause className="w-12 h-12 fill-current" />
                    ) : (
                      <Play className="w-12 h-12 fill-current ml-2" />
                    )}
                  </button>
                  <button 
                    onClick={() => skip(15)}
                    className="p-4 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-2xl border border-white/5 hover:border-white/10"
                    title="Skip Forward 15s"
                  >
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <button className="p-4 rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all group" title="Share Narraration">
                    <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button className="p-4 rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all group" title="Playlist">
                    <ListMusic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Performance & Audio Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-5 border-white/5 rounded-3xl bg-white/[0.02] flex flex-col gap-4">
                  <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-widest text-zinc-500">
                    <span>Playback Speed</span>
                    <span className="text-red-500">{playbackSpeed}x</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 1.25, 1.5, 2].map((s) => (
                      <button 
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[10px] font-black transition-all border",
                          playbackSpeed === s ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-white/5 border-white/5 text-zinc-600 hover:text-zinc-400"
                        )}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-5 border-white/5 rounded-3xl bg-white/[0.02] flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-widest text-zinc-500">
                    <span>Volume</span>
                    <Volume2 className="w-3 h-3" />
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-zinc-500"
                  />
                </div>
              </div>

              {/* Meta Info Card */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] flex items-center gap-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5">
                  <Info className="w-6 h-6 text-zinc-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Production Quality</p>
                  <p className="text-xs text-zinc-400 italic font-serif">High Fidelity Lossless Audio • 48kHz Stereo</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Hidden Audio Context */}
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
