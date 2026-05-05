"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { BOOKS } from "@/constants/library";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Lock, ChevronRight, Play, CheckCircle, Sparkles, Scroll } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const CHAPTERS = [
  { id: "ch-0", title: "Prologue: Storm of Blood", paidOnly: false },
  { id: "ch-1", title: "Chapter 1: Awakening in Ash", paidOnly: true },
  { id: "ch-2", title: "Chapter 2: Patrol of the Marshal", paidOnly: true },
  { id: "ch-3", title: "Chapter 3: Blood on the Dunes", paidOnly: true },
  { id: "ch-4", title: "Chapter 4: Refuge in the Oil Derrick", paidOnly: true },
  { id: "ch-5", title: "Chapter 5: Rescue at Dusk", paidOnly: true },
];

export default function BookDetailPage() {
  const { bookId } = useParams();
  const { profile } = useAuth();
  const book = BOOKS.find(b => b.bookId === bookId);
  const isPaid = profile?.membershipStatus === "paid" || profile?.membershipStatus === "admin" || profile?.membershipStatus === "owner";

  if (!book) return <div className="min-h-screen bg-black flex items-center justify-center font-serif italic text-amber-500">Book not found in the archives...</div>;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        <div className="p-8 max-w-6xl mx-auto space-y-16">
          
          {/* Back Navigation */}
          <Link 
            href="/library" 
            className="group flex items-center gap-2 text-zinc-500 hover:text-amber-500 transition-colors w-fit"
          >
            <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-amber-500/50 transition-all">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest">Return to Archives</span>
          </Link>

          {/* Book Hero section */}
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-2/5 relative group"
            >
              <div className="absolute -inset-4 bg-amber-500/10 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative aspect-[2/3] glass-panel p-2 border-white/10 group-hover:border-amber-500/30 transition-all duration-700 shadow-2xl overflow-hidden rounded-[2rem]">
                <img 
                  src={book.coverImage} 
                  className="w-full h-full object-cover rounded-[1.5rem] group-hover:scale-105 transition-transform duration-1000" 
                  alt={book.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>
            </motion.div>
            
            <div className="flex-1 space-y-10 py-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-amber-500/10 text-amber-500 text-[10px] uppercase font-black tracking-[0.3em] px-3 py-1 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                    Book {book.bookNumber}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
                </div>
                <h1 className="text-5xl md:text-7xl text-white font-serif italic tracking-tighter leading-none gold-gradient-text">
                  {book.title}
                </h1>
                <p className="text-amber-500/60 text-sm uppercase tracking-[0.4em] font-bold">{book.subtitle}</p>
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-zinc-400 text-xl italic font-serif leading-relaxed max-w-2xl"
              >
                "{book.description}"
              </motion.p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-panel p-6 border-white/5 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-black tracking-widest">Reading Progress</span>
                    </div>
                    <span className="text-2xl text-white font-serif italic">12%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 w-[12%] shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass-panel p-6 border-white/5 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Headphones className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-black tracking-widest">Audio Progress</span>
                    </div>
                    <span className="text-2xl text-white font-serif italic">0%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-red-400 w-0 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                  </div>
                </motion.div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link 
                  href={`/library/${book.bookId}/chapter/ch-0`}
                  className="premium-button px-10 py-5 flex items-center gap-3 text-[11px] uppercase font-black tracking-widest group"
                >
                  Continue Reading <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href={`/library/${book.bookId}/audio/ch-0`}
                  className="glass-panel hover:bg-white/5 border-white/10 px-10 py-5 flex items-center gap-3 text-[11px] uppercase font-black tracking-widest text-zinc-400 hover:text-white transition-all group"
                >
                  Resume Audio <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Chapter List */}
          <div className="space-y-10 pt-16 border-t border-white/5">
            <div className="flex items-center gap-6">
              <h2 className="text-3xl text-white font-serif italic gold-gradient-text">Chapters</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {CHAPTERS.map((chapter, idx) => {
                const locked = chapter.paidOnly && !isPaid;
                return (
                  <motion.div 
                    key={chapter.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={locked ? "#" : `/library/${book.bookId}/chapter/${chapter.id}`}
                      className={cn(
                        "glass-panel p-6 flex items-center justify-between group transition-all border-white/5",
                        locked ? "opacity-50 grayscale cursor-not-allowed" : "hover:border-amber-500/30 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-center gap-8">
                        <span className="text-[10px] text-zinc-500 font-black w-8 group-hover:text-amber-500 transition-colors">
                          {idx === 0 ? "PRL" : idx.toString().padStart(2, "0")}
                        </span>
                        <div className="space-y-1">
                          <h4 className="text-xl text-zinc-200 font-serif italic group-hover:text-white transition-colors">{chapter.title}</h4>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Approx. 12 min read</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {locked ? (
                          <div className="flex items-center gap-2.5 text-[9px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/5 px-4 py-1.5 rounded-full border border-amber-500/20">
                            <Lock className="w-3.5 h-3.5" /> Paid Member
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            <div className="p-3 rounded-full bg-white/5 text-zinc-400 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-all">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="p-3 rounded-full bg-white/5 text-zinc-400 group-hover:bg-red-500/10 group-hover:text-red-500 transition-all">
                              <Headphones className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
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
