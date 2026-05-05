"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import { BOOK_I_NODES } from "@/constants/campaign";
import { MASTER_CARDS } from "@/constants/cards";
import { motion } from "framer-motion";
import { Shield, Database, Users, BookOpen, AlertTriangle, CheckCircle, RefreshCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ users: 0, cards: 0, campaigns: 0 });
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = profile?.role === "admin" || profile?.role === "owner";

  useEffect(() => {
    async function fetchStats() {
      if (!isAdmin) return;
      
      const usersSnap = await getDocs(collection(db, "users"));
      const cardsSnap = await getDocs(collection(db, "cards"));
      const campSnap = await getDocs(collection(db, "campaigns"));
      
      setStats({
        users: usersSnap.size,
        cards: cardsSnap.size,
        campaigns: campSnap.size
      });
      setLoading(false);
    }
    fetchStats();
  }, [isAdmin]);

  const seedDatabase = async () => {
    if (!confirm("Are you sure you want to seed/reset master data?")) return;
    setIsSeeding(true);
    setMessage("Seeding Master Cards...");
    try {
      // Seed Cards
      for (const card of MASTER_CARDS) {
        await setDoc(doc(db, "cards", card.cardId), card);
      }
      
      setMessage("Seeding Campaign Nodes...");
      // Seed Campaign
      await setDoc(doc(db, "campaigns", "book1_red_country"), {
        id: "book1_red_country",
        name: "Book I: Blood on the Yellow Brick — Red Country",
        totalNodes: BOOK_I_NODES.length,
        difficulty: "Beginner",
        rewardShardRate: 1.5
      });

      for (const node of BOOK_I_NODES) {
        await setDoc(doc(db, "campaigns", "book1_red_country", "nodes", node.id), node);
      }

      setMessage("Database successfully seeded!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="gothic-panel p-12 text-center space-y-6">
            <AlertTriangle className="w-16 h-16 text-secondary mx-auto" />
            <h1 className="text-3xl font-serif italic text-white">Access Forbidden</h1>
            <p className="text-muted-foreground">This chamber is reserved for the High Archivists.</p>
            <button onClick={() => window.history.back()} className="brass-button px-8 py-3">Return to Safety</button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-12">
        <header className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs uppercase font-bold tracking-[0.3em] mb-2">
              <Shield className="w-4 h-4" /> Admin Command Center
            </div>
            <h1 className="text-5xl font-serif italic text-white">The Archivist's Sanctum</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={seedDatabase} 
              disabled={isSeeding}
              className="brass-button px-6 py-3 flex items-center gap-2"
            >
              <Database className={cn("w-4 h-4", isSeeding && "animate-spin")} /> {isSeeding ? "Syncing..." : "Seed Master Data"}
            </button>
          </div>
        </header>

        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5" /> {message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="gothic-panel p-8 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground uppercase text-xs font-bold tracking-widest">
              <Users className="w-4 h-4" /> Total Players
            </div>
            <p className="text-5xl font-serif italic text-white">{stats.users}</p>
          </div>
          <div className="gothic-panel p-8 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground uppercase text-xs font-bold tracking-widest">
              <Database className="w-4 h-4" /> Master Cards
            </div>
            <p className="text-5xl font-serif italic text-white">{stats.cards}</p>
          </div>
          <div className="gothic-panel p-8 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground uppercase text-xs font-bold tracking-widest">
              <BookOpen className="w-4 h-4" /> Active Campaigns
            </div>
            <p className="text-5xl font-serif italic text-white">{stats.campaigns}</p>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-serif italic text-white border-b border-primary/20 pb-2">Content Pipeline</h2>
            <div className="space-y-4">
              <div className="p-6 bg-white/5 border border-white/10 rounded group hover:border-primary/40 transition-colors">
                <h3 className="text-lg font-serif italic text-white mb-2">Book I: Blood on the Yellow Brick</h3>
                <p className="text-sm text-muted-foreground mb-4">24 Nodes, 5 Story Events, 3 Secret Passages.</p>
                <div className="flex gap-3">
                  <button className="text-[10px] uppercase font-bold tracking-widest text-primary hover:text-white">Edit Nodes</button>
                  <button className="text-[10px] uppercase font-bold tracking-widest text-primary hover:text-white">Preview Map</button>
                </div>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded group hover:border-primary/40 transition-colors opacity-50">
                <h3 className="text-lg font-serif italic text-white mb-2">Book II: Gears of the Emerald Heart</h3>
                <p className="text-sm text-muted-foreground mb-4">In Development. Seeding Locked.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-serif italic text-white border-b border-primary/20 pb-2">Archival Logs</h2>
            <div className="gothic-panel min-h-[400px] p-0 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="p-4">Action</th>
                    <th className="p-4">Archivist</th>
                    <th className="p-4">Target</th>
                    <th className="p-4">Time</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-white/80">
                  <tr className="border-b border-white/5">
                    <td className="p-4 flex items-center gap-2"><RefreshCcw className="w-3 h-3 text-primary" /> Seed Data</td>
                    <td className="p-4">Admin</td>
                    <td className="p-4">Master Cards</td>
                    <td className="p-4">Just Now</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
