"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { BOOKS } from "@/constants/library";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Lock, Sparkles, Scroll, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LibraryHome() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        <div className="p-8 max-w-7xl mx-auto space-y-20">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto space-y-8 pt-16 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center gap-4 relative">
                <div className="flex items-center gap-3 text-amber-500/60 bg-amber-500/5 px-4 py-1.5 rounded-full border border-amber-500/10 backdrop-blur-xl">
                  <Scroll className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-[0.4em] font-bold">The Archives of Oz</span>
                </div>
                <h1 className="font-serif text-6xl md:text-8xl gold-gradient-text italic tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                  The Forbidden Library
                </h1>
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              </div>
              
              <p className="text-zinc-400 text-xl font-serif italic max-w-2xl mx-auto leading-relaxed">
                Every word is a contract. Every story is a scar. Unlock the full history of the Horror of Oz and witness the true nature of the Yellow Path.
              </p>
            </motion.div>
          </div>

          {/* Books Shelf */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {BOOKS.map((book, index) => (
              <motion.div
                key={book.bookId}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                className="group relative"
              >
                {/* Book Shadow & Glow */}
                <div className="absolute -inset-4 bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-[3rem]" />
                
                <div className="glass-panel overflow-hidden relative flex flex-col h-full border-white/5 group-hover:border-amber-500/30 transition-all duration-500 hover:translate-y-[-8px]">
                  {/* Cover Area */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    
                    {book.status === "coming-soon" && (
                      <div className="absolute top-6 right-6 bg-black/80 backdrop-blur-2xl px-5 py-2 border border-white/10 rounded-full flex items-center gap-2.5 shadow-2xl">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Sealed by Fog</span>
                      </div>
                    )}
                    
                    <div className="absolute bottom-8 left-8 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500/80" />
                        <span className="text-[10px] text-amber-500/80 font-black uppercase tracking-[0.4em]">Volume {book.bookNumber}</span>
                      </div>
                      <h3 className="text-4xl text-white font-serif italic group-hover:gold-gradient-text transition-all duration-300 drop-shadow-2xl">
                        {book.title}
                      </h3>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-8 flex-1 flex flex-col bg-zinc-950/40 backdrop-blur-md">
                    <p className="text-sm text-zinc-400 mb-10 line-clamp-3 italic font-serif leading-relaxed">
                      "{book.description}"
                    </p>
                    
                    <div className="mt-auto space-y-6">
                      <div className="flex justify-between items-center px-6 py-4 bg-black/60 rounded-2xl border border-white/5 backdrop-blur-xl">
                        <div className="flex items-center gap-2.5 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-black tracking-widest">{book.totalChapters} Chapters</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2.5 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                          <Headphones className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-black tracking-widest">Audiobook</span>
                        </div>
                      </div>

                      {book.status === "available" ? (
                        <div className="grid grid-cols-2 gap-4">
                          <Link 
                            href={`/library/${book.bookId}`} 
                            className="premium-button py-4 text-[10px] flex items-center justify-center gap-2.5 uppercase tracking-[0.25em] font-black group/btn"
                          >
                            Read Lore <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                          <Link 
                            href={`/library/${book.bookId}?audio=true`} 
                            className="glass-panel hover:bg-white/5 py-4 text-[10px] flex items-center justify-center gap-2.5 uppercase tracking-[0.25em] font-black text-zinc-400 hover:text-white transition-all border-white/10"
                          >
                            Listen <Headphones className="w-4 h-4" />
                          </Link>
                        </div>
                      ) : (
                        <div className="w-full bg-zinc-900/40 text-zinc-600 border border-white/5 py-4 text-[10px] uppercase tracking-[0.4em] font-black text-center rounded-2xl cursor-not-allowed backdrop-blur-sm">
                          Locked in the Void
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
