"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, limit, updateDoc, serverTimestamp } from "firebase/firestore";
import { BOOK_I_NODES } from "@/constants/campaign";
import { MASTER_CARDS } from "@/constants/cards";
import { OWNER_UID } from "@/lib/auth-utils";
import { motion } from "framer-motion";
import { Shield, Database, Users, BookOpen, AlertTriangle, CheckCircle, RefreshCcw, Save, Zap, Heart, Star, LayoutDashboard, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, profile, isOwner } = useAuth();
  const [stats, setStats] = useState({ users: 0, cards: 0, campaigns: 0, affiliates: 0 });
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = profile?.role === "admin" || isOwner;

  useEffect(() => {
    async function fetchStats() {
      if (!isAdmin) return;
      
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const cardsSnap = await getDocs(collection(db, "cards"));
        const campSnap = await getDocs(collection(db, "campaigns"));
        const affSnap = await getDocs(collection(db, "affiliates"));
        
        setStats({
          users: usersSnap.size,
          cards: cardsSnap.size,
          campaigns: campSnap.size,
          affiliates: affSnap.size
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [isAdmin]);

  const repairOwnerProfile = async () => {
    if (!isOwner || !user) return;
    setIsRepairing(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: "owner",
        membershipStatus: "owner",
        verified: true,
        updatedAt: serverTimestamp()
      });
      setMessage("Owner Profile Repaired in the Great Archive.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsRepairing(false);
    }
  };

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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2 text-primary text-xs uppercase font-bold tracking-[0.3em]">
                <Shield className="w-4 h-4" /> Admin Command Center
              </div>
              {isOwner && (
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] uppercase font-black tracking-widest text-emerald-500 flex items-center gap-2 animate-pulse">
                   <Zap className="w-3 h-3" /> Owner Access Active
                </div>
              )}
            </div>
            <h1 className="text-5xl font-serif italic text-white">The Archivist's Sanctum</h1>
          </div>
          <div className="flex flex-wrap gap-4">
            {isOwner && (
              <button 
                onClick={repairOwnerProfile} 
                disabled={isRepairing}
                className="bg-white/5 border border-white/10 text-zinc-400 hover:text-white px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all flex items-center gap-2"
              >
                <Heart className={cn("w-4 h-4", isRepairing && "animate-pulse text-red-500")} /> {isRepairing ? "Repairing..." : "Repair Owner Profile"}
              </button>
            )}
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
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-3 rounded-lg backdrop-blur-md">
            <CheckCircle className="w-5 h-5" /> {message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="gothic-panel p-8 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground uppercase text-xs font-bold tracking-widest">
              <Users className="w-4 h-4" /> Total Players
            </div>
            <p className="text-5xl font-serif italic text-white">{stats.users}</p>
          </div>
          <div className="gothic-panel p-8 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground uppercase text-xs font-bold tracking-widest">
              <Star className="w-4 h-4" /> Affiliates
            </div>
            <p className="text-5xl font-serif italic text-white">{stats.affiliates}</p>
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

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-6">
             <h2 className="text-2xl font-serif italic text-white border-b border-primary/20 pb-2">Archival Controls</h2>
             <div className="grid grid-cols-1 gap-4">
                <Link href="/admin/characters" className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:border-primary/40 transition-all flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Users className="w-5 h-5" /></div>
                      <div>
                         <p className="text-white font-serif italic">Character Bible</p>
                         <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Visual Reference Registry</p>
                      </div>
                   </div>
                   <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
                <Link href="/admin/affiliates" className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:border-primary/40 transition-all flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><LayoutDashboard className="w-5 h-5" /></div>
                      <div>
                         <p className="text-white font-serif italic">Affiliate Oversight</p>
                         <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Referrals & Rewards</p>
                      </div>
                   </div>
                   <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
                <Link href="/admin/launch" className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:border-primary/40 transition-all flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary"><Zap className="w-5 h-5" /></div>
                      <div>
                         <p className="text-white font-serif italic">Launch Tools</p>
                         <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Marketplace & Global Toggles</p>
                      </div>
                   </div>
                   <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
             </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-serif italic text-white border-b border-primary/20 pb-2">Content Pipeline</h2>
            <div className="space-y-4">
              <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] group hover:border-primary/40 transition-colors">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h3 className="text-xl font-serif italic text-white mb-2">Book I: Blood on the Yellow Brick</h3>
                      <p className="text-sm text-muted-foreground">Red Country — Active Sector</p>
                   </div>
                   <span className="px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-widest text-primary">Live</span>
                </div>
                <p className="text-sm text-zinc-500 mb-6 font-serif italic leading-relaxed">The nightmare begins. Tracking 24 nodes across the scorched country. All systems nominal.</p>
                <div className="flex gap-4">
                  <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] uppercase font-black tracking-widest text-zinc-400 hover:text-white transition-all">Edit Nodes</button>
                  <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] uppercase font-black tracking-widest text-zinc-400 hover:text-white transition-all">Event Logs</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
