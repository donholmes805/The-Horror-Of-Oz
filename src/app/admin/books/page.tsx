"use client";

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Headphones, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Shield,
  Search,
  Book
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BOOKS } from '@/constants/library';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminBooksPage() {
  const { profile, isOwner } = useAuth();
  const [audiobookStats, setAudiobookStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === "admin" || isOwner;

  useEffect(() => {
    async function fetchStats() {
      if (!isAdmin) return;
      try {
        const q = query(collection(db, "audiobookChapters"), where("status", "==", "approved"));
        const snap = await getDocs(q);
        const stats: Record<string, number> = {};
        snap.docs.forEach(doc => {
          const data = doc.data();
          stats[data.bookId] = (stats[data.bookId] || 0) + 1;
        });
        setAudiobookStats(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(true); // Wait for actual data if needed, but let's just set loading false for now
        setLoading(false);
      }
    }
    fetchStats();
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-500">Curator Dashboard</span>
          </div>
          <h1 className="text-5xl text-white font-serif italic">Audiobook Library Oversight</h1>
          <p className="text-zinc-500 font-serif italic max-w-2xl">
            Manage the voices of the Yellow Path. Monitor narration progress across all six volumes of the Horror.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BOOKS.map((book) => {
            const approvedCount = audiobookStats[book.bookId] || 0;
            const progress = (approvedCount / book.totalChapters) * 100;

            return (
              <motion.div 
                key={book.bookId}
                whileHover={{ y: -5 }}
                className="glass-panel group overflow-hidden rounded-[2.5rem] border-white/5 bg-black/40 flex flex-col"
              >
                <div className="aspect-[16/9] relative overflow-hidden">
                  <img src={book.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" alt={book.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase font-black tracking-widest text-primary">Volume {book.bookNumber}</span>
                      <h3 className="text-xl text-white font-serif italic leading-tight">{book.title}</h3>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-6 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-zinc-500">
                      <span>Narration Progress</span>
                      <span className="text-white">{approvedCount} / {book.totalChapters}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary shadow-[0_0_10px_rgba(184,134,11,0.5)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-zinc-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{book.totalChapters - approvedCount} Chapters Remaining</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Link href={`/admin/books/${book.bookId}`} className="block">
                      <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[9px] uppercase font-black tracking-widest text-zinc-400 group-hover:text-white group-hover:border-primary/40 group-hover:bg-primary/5 transition-all flex items-center justify-center gap-3">
                        Manage Chapters
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
