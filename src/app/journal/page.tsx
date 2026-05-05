"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  Map as MapIcon, 
  Layers, 
  BookOpen, 
  ArrowLeftRight, 
  Store, 
  Trophy, 
  ShieldCheck, 
  Clock, 
  Zap, 
  Skull, 
  Search, 
  Compass, 
  Lock, 
  Unlock, 
  Sparkles, 
  Scroll, 
  ArrowRight,
  UserCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Heart,
  Sword,
  Shield,
  Info,
  AlertCircle,
  Headphones,
  MapPin,
  Users,
  BadgeCheck
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { BOOK_I_NODES } from "@/constants/campaign";
import { BOOKS } from "@/constants/library";
import { MASTER_CARDS, Rarity } from "@/constants/cards";
import Link from "next/link";
import { cn } from "@/lib/utils";

const RARITY_COLORS: Record<string, string> = {
  Starter: "text-[#b8860b]",
  Common: "text-zinc-400",
  Uncommon: "text-[#4d5d53]",
  Rare: "text-[#00c2ff]",
  Epic: "text-[#9d00ff]",
  Legendary: "text-[#ffcc00]",
  Founder: "text-[#ff003c]",
};

export default function PathfinderJournal() {
  const { user, profile } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubProgress = onSnapshot(doc(db, "playerProgress", user.uid), (doc) => {
      if (doc.exists()) setProgress(doc.data());
    });

    const unsubStats = onSnapshot(doc(db, "playerStats", user.uid), (doc) => {
      if (doc.exists()) setStats(doc.data());
    });

    // Fetch Cards
    const fetchCards = async () => {
      const q = query(collection(db, "users", user.uid, "playerCards"), orderBy("acquiredAt", "desc"), limit(20));
      const snap = await getDocs(q);
      setUserCards(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    };

    // Fetch Marketplace Listings
    const fetchListings = async () => {
      const q = query(collection(db, "marketplaceListings"), where("sellerId", "==", user.uid));
      const snap = await getDocs(q);
      setListings(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    };

    // Fetch Trades
    const fetchTrades = async () => {
      const q1 = query(collection(db, "trades"), where("initiatorId", "==", user.uid));
      const q2 = query(collection(db, "trades"), where("receiverId", "==", user.uid));
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      setTrades([...s1.docs.map(d => d.data()), ...s2.docs.map(d => d.data())]);
    };

    Promise.all([fetchCards(), fetchListings(), fetchTrades()]).finally(() => {
      setLoading(false);
    });

    return () => {
      unsubProgress();
      unsubStats();
    };
  }, [user]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-primary/20 blur-[30px] animate-pulse" />
              <History className="w-full h-full text-primary animate-spin-slow" />
            </div>
            <p className="font-serif italic text-zinc-500 animate-pulse">Consulting the Journal...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate Progress
  const completedNodesCount = progress?.completedNodes?.length || 0;
  const totalNodesCount = BOOK_I_NODES.length;
  const progressPercent = Math.round((completedNodesCount / totalNodesCount) * 100);
  const currentNode = BOOK_I_NODES.find(n => n.id === progress?.currentNode);
  const isBossDefeated = progress?.completedNodes?.includes("book1_node_023");

  // Card Stats
  const cardStats = {
    total: userCards.length,
    rarities: userCards.reduce((acc: any, card) => {
      acc[card.rarity] = (acc[card.rarity] || 0) + 1;
      return acc;
    }, {}),
    locked: userCards.filter(c => c.bound || (c.tradeUnlockDate?.seconds * 1000 > Date.now())).length,
    tradeable: userCards.filter(c => c.tradeable && !c.bound && (!c.tradeUnlockDate || c.tradeUnlockDate.seconds * 1000 <= Date.now())).length,
    sellable: userCards.filter(c => c.sellable && !c.bound && (!c.saleUnlockDate || c.saleUnlockDate.seconds * 1000 <= Date.now())).length,
  };

  // Reading Progress
  const book1Progress = progress?.libraryProgress?.["book-1"] || {};
  const book1Read = book1Progress.readPercent || 0;
  const book1Listen = book1Progress.listenPercent || 0;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 md:space-y-20 pt-24 md:pt-32">
          
          {/* 1. Journal Header */}
          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="glass-panel p-8 md:p-12 rounded-[3rem] border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
                {/* Avatar Section */}
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-primary/30 p-2 shadow-[0_0_50px_rgba(184,134,11,0.1)] group-hover:border-primary/60 transition-all duration-500">
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center border border-white/5 shadow-inner">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-20 h-20 text-zinc-800" />
                      )}
                    </div>
                  </div>
                  {/* Membership Badge */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-zinc-950 border border-primary/30 rounded-full shadow-2xl flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    <span className="text-[8px] uppercase tracking-widest font-black text-primary">
                      {profile?.membershipStatus === "paid" ? "Paid Member" : profile?.role === "admin" ? "Admin" : profile?.role === "owner" ? "Owner" : "Free Member"}
                    </span>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 text-center md:text-left space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <h1 className="font-serif text-5xl md:text-7xl gold-gradient-text italic tracking-tighter leading-none">
                        Pathfinder’s Journal
                      </h1>
                    </div>
                    <p className="text-zinc-500 text-sm md:text-lg italic font-serif">
                      Your record along the Yellow Path — campaigns survived, cards claimed, chapters read, and horrors encountered.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 pt-4">
                    <div className="space-y-1 group/stat relative">
                      <div className="flex items-center gap-2">
                        <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-600 font-black">Identity</p>
                        <Info className="w-2.5 h-2.5 text-zinc-800 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xl text-white font-serif italic">{profile?.username || "Pathwalker"}</p>
                      <div className="absolute bottom-full left-0 mb-2 w-48 opacity-0 group-hover/stat:opacity-100 pointer-events-none transition-all z-50">
                        <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                          Your chosen name along the Yellow Path. It is how other Pathwalkers recognize you in the Bazaar.
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 group/stat relative">
                      <div className="flex items-center gap-2">
                        <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-600 font-black">Player Level</p>
                        <Info className="w-2.5 h-2.5 text-zinc-800 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xl text-primary font-serif italic">Rank {profile?.level || 1}</p>
                      <div className="absolute bottom-full left-0 mb-2 w-48 opacity-0 group-hover/stat:opacity-100 pointer-events-none transition-all z-50">
                        <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                          Reflects your experience. Higher ranks may unlock advanced artifacts or deeper library archives.
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 group/stat relative">
                      <div className="flex items-center gap-2">
                        <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-600 font-black">Yellow Shards</p>
                        <Info className="w-2.5 h-2.5 text-zinc-800 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xl text-amber-500 font-serif italic">{profile?.yellowShards || 0} Shards</p>
                      <div className="absolute bottom-full left-0 mb-2 w-48 opacity-0 group-hover/stat:opacity-100 pointer-events-none transition-all z-50">
                        <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                          The currency of the Nightmare. Earned through searches or sold artifacts; used in the Bazaar.
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 group/stat relative">
                      <div className="flex items-center gap-2">
                        <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-600 font-black">Joined Path</p>
                        <Info className="w-2.5 h-2.5 text-zinc-800 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xl text-zinc-400 font-serif italic">
                        {profile?.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Before Storm"}
                      </p>
                      <div className="absolute bottom-full left-0 mb-2 w-48 opacity-0 group-hover/stat:opacity-100 pointer-events-none transition-all z-50">
                        <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                          The date you first stepped onto the Yellow Path and began your descent into the Horror.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            
            {/* LEFT COLUMN - Progress & Stats */}
            <div className="lg:col-span-8 space-y-12 md:space-y-20">
              
              {/* 2. Campaign Progress Section */}
              <section className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/60 flex items-center gap-3">
                    <MapIcon className="w-4 h-4" /> Campaign Progression
                  </h2>
                  <Link href="/campaign" className="text-[9px] uppercase tracking-widest font-black text-zinc-500 hover:text-white transition-all flex items-center gap-2">
                    Continue Campaign <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border-white/5 bg-black/60 relative overflow-hidden group">
                  <div className="flex flex-col md:flex-row gap-10">
                    {/* Map Visual / Icon */}
                    <div className="w-full md:w-48 aspect-square rounded-3xl bg-zinc-950 border border-white/5 flex items-center justify-center relative overflow-hidden">
                       <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/identicon/svg?seed=map')] opacity-10 bg-cover" />
                       <Compass className="w-16 h-16 text-primary relative z-10 group-hover:rotate-45 transition-transform duration-1000" />
                    </div>

                    <div className="flex-1 space-y-8">
                      <div className="space-y-2">
                        <h3 className="text-3xl text-white font-serif italic">Book I: Blood on the Yellow Brick</h3>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 italic font-serif">
                          <span className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-primary" /> Red Country</span>
                          <div className="w-1 h-1 rounded-full bg-zinc-800" />
                          <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-primary" /> {currentNode?.name || "The Start"}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-zinc-500">
                          <span>Progress Through Section {currentNode?.section || 1}</span>
                          <span className="text-primary">{progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-primary/40 to-primary rounded-full shadow-[0_0_10px_rgba(184,134,11,0.5)]"
                          />
                        </div>
                        <div className="flex justify-between text-[8px] uppercase tracking-widest text-zinc-700 font-black">
                          <span>{completedNodesCount} Nodes Secured</span>
                          <span>{totalNodesCount} Total Nodes</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-2">
                          <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Boss Status</p>
                          <div className="flex items-center gap-2">
                            {isBossDefeated ? (
                              <Skull className="w-4 h-4 text-red-500" />
                            ) : (
                              <Skull className="w-4 h-4 text-zinc-800" />
                            )}
                            <span className={cn("text-xs font-serif italic", isBossDefeated ? "text-red-500" : "text-zinc-600")}>
                              {isBossDefeated ? "Marshal Argent Defeated" : "Marshal Argent Awaits"}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-2">
                          <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Inventory</p>
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            <span className="text-xs font-serif italic text-white">
                              {progress?.inventoryKeys?.length || 0} Relic Keys Found
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Card Collection Summary */}
              <section className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/60 flex items-center gap-3">
                    <Layers className="w-4 h-4" /> Vault Statistics
                  </h2>
                  <Link href="/cards" className="text-[9px] uppercase tracking-widest font-black text-zinc-500 hover:text-white transition-all flex items-center gap-2">
                    Open Vault <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="glass-panel p-6 rounded-3xl bg-black/40 border-white/5 text-center space-y-2 group/stat relative">
                      <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Total Artifacts</p>
                      <p className="text-3xl text-white font-serif italic">{cardStats.total}</p>
                      <div className="absolute top-2 right-2 opacity-0 group-hover/stat:opacity-100 transition-opacity">
                        <Info className="w-2.5 h-2.5 text-zinc-800" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 opacity-0 group-hover/stat:opacity-100 pointer-events-none transition-all z-50">
                        <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                          The grand total of all artifacts, allies, and relics you have secured.
                        </div>
                      </div>
                   </div>
                   <div className="glass-panel p-6 rounded-3xl bg-black/40 border-white/5 text-center space-y-2 group/stat relative">
                      <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Soulbound</p>
                      <p className="text-3xl text-red-500/80 font-serif italic">{cardStats.locked}</p>
                      <div className="absolute top-2 right-2 opacity-0 group-hover/stat:opacity-100 transition-opacity">
                        <Info className="w-2.5 h-2.5 text-zinc-800" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 opacity-0 group-hover/stat:opacity-100 pointer-events-none transition-all z-50">
                        <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                          Artifacts bound to your soul. These cannot be traded or sold until their binding ritual expires.
                        </div>
                      </div>
                   </div>
                   <div className="glass-panel p-6 rounded-3xl bg-black/40 border-white/5 text-center space-y-2 group/stat relative">
                      <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Tradeable</p>
                      <p className="text-3xl text-blue-400 font-serif italic">{cardStats.tradeable}</p>
                      <div className="absolute top-2 right-2 opacity-0 group-hover/stat:opacity-100 transition-opacity">
                        <Info className="w-2.5 h-2.5 text-zinc-800" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 opacity-0 group-hover/stat:opacity-100 pointer-events-none transition-all z-50">
                        <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                          Artifacts eligible for direct exchange with other Pathwalkers in the Trading Post.
                        </div>
                      </div>
                   </div>
                   <div className="glass-panel p-6 rounded-3xl bg-black/40 border-white/5 text-center space-y-2 group/stat relative">
                      <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Bazaar Ready</p>
                      <p className="text-3xl text-emerald-400 font-serif italic">{cardStats.sellable}</p>
                      <div className="absolute top-2 right-2 opacity-0 group-hover/stat:opacity-100 transition-opacity">
                        <Info className="w-2.5 h-2.5 text-zinc-800" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 opacity-0 group-hover/stat:opacity-100 pointer-events-none transition-all z-50">
                        <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                          Artifacts that can be listed for Yellow Shards in the grand Bazaar exchange.
                        </div>
                      </div>
                   </div>
                </div>

                <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/60 space-y-8">
                   <p className="text-[8px] uppercase tracking-widest text-zinc-700 font-black text-center">Rarity Distribution</p>
                   <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                      {Object.keys(RARITY_COLORS).map(rarity => {
                        const count = cardStats.rarities[rarity] || 0;
                        return (
                          <div key={rarity} className="flex flex-col items-center gap-2 group">
                             <div className={cn(
                               "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-500",
                               count > 0 ? "bg-white/5 border-white/10" : "bg-black/40 border-white/5 opacity-20"
                             )}>
                                <Sparkles className={cn("w-5 h-5", count > 0 ? RARITY_COLORS[rarity] : "text-zinc-800")} />
                             </div>
                             <span className={cn("text-[7px] uppercase font-black tracking-widest", count > 0 ? "text-zinc-400" : "text-zinc-800")}>{rarity}</span>
                             <span className={cn("text-xs font-serif italic", count > 0 ? "text-white" : "text-zinc-800")}>{count}</span>
                          </div>
                        );
                      })}
                   </div>
                   
                   {/* Recent Cards Row */}
                   <div className="pt-8 border-t border-white/5">
                      <p className="text-[8px] uppercase tracking-widest text-zinc-700 font-black mb-6">Recently Acquired</p>
                      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {userCards.slice(0, 5).map((card, i) => (
                          <Link key={i} href="/cards" className="flex-shrink-0 w-24 h-36 rounded-xl bg-zinc-950 border border-white/10 overflow-hidden relative group">
                            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            <div className={cn("absolute top-2 right-2 w-2 h-2 rounded-full", RARITY_COLORS[card.rarity as Rarity])} style={{ background: 'currentColor' }} />
                          </Link>
                        ))}
                        {userCards.length === 0 && (
                          <p className="text-zinc-600 italic text-sm py-8 w-full text-center">No artifacts recovered yet.</p>
                        )}
                      </div>
                   </div>
                </div>
              </section>

              {/* 4. Achievements / Badges Section */}
              <section className="space-y-8">
                <div className="flex items-center px-4">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/60 flex items-center gap-3">
                    <Trophy className="w-4 h-4" /> Noted Achievements
                  </h2>
                </div>

                <div className="glass-panel p-12 rounded-[2.5rem] border-white/5 bg-black/60 text-center space-y-6">
                  <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center mx-auto border border-white/5 shadow-inner">
                     <Scroll className="w-8 h-8 text-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl text-zinc-500 font-serif italic">No titles have been carved into your Journal yet.</p>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-700 font-black max-w-xs mx-auto leading-relaxed">
                      Complete campaign milestones and collect legendary artifacts to earn your place in the chronicles.
                    </p>
                  </div>
                  <Link href="/campaign" className="premium-button px-8 py-4 text-[9px] inline-block">Walk the Yellow Path</Link>
                </div>
              </section>

              {/* 8. Horror Stats / Encounter History */}
              <section className="space-y-8">
                <div className="flex items-center px-4">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/60 flex items-center gap-3">
                    <Skull className="w-4 h-4" /> Encounter Statistics
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { label: "Enemies Survived", value: stats?.enemiesDefeated || 0, icon: <Sword className="w-4 h-4" /> },
                    { label: "Searches Completed", value: stats?.searchesCompleted || 0, icon: <Search className="w-4 h-4" /> },
                    { label: "Locked Doors Breached", value: stats?.doorsOpened || 0, icon: <Unlock className="w-4 h-4" /> },
                    { label: "Story Choices Made", value: stats?.choicesMade || 0, icon: <BookOpen className="w-4 h-4" /> },
                    { label: "Boss Attempts", value: stats?.bossAttempts || 0, icon: <Skull className="w-4 h-4" /> },
                    { label: "Highest Threat Neutralized", value: stats?.highestThreat || "0", icon: <TrendingUp className="w-4 h-4" /> },
                  ].map((stat, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl bg-black/40 border-white/5 flex flex-col gap-3 group hover:border-primary/20 transition-all">
                       <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-white/5 text-zinc-600 group-hover:text-primary transition-colors">
                         {stat.icon}
                       </div>
                       <div className="space-y-1">
                          <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">{stat.label}</p>
                          <p className="text-2xl text-white font-serif italic">{stat.value}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* RIGHT COLUMN - Activity & Progress */}
            <div className="lg:col-span-4 space-y-12 md:space-y-20">
              
              {/* 5 & 6. Reading & Listening Progress */}
              <section className="space-y-8">
                <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/60 flex items-center gap-3 px-4">
                  <BookOpen className="w-4 h-4" /> Chronicler Progress
                </h2>

                <div className="space-y-6">
                  {/* Reading */}
                  <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/60 space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Current Tome</p>
                          <h4 className="text-lg text-white font-serif italic">Blood on the Yellow Brick</h4>
                       </div>
                       <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex justify-between text-[8px] uppercase tracking-widest text-zinc-500 font-black">
                          <span>Reading</span>
                          <span>{book1Read}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${book1Read}%` }} />
                       </div>
                    </div>

                    {book1Read > 0 ? (
                      <Link href="/library/book-1" className="premium-button w-full py-4 text-[9px] flex items-center justify-center gap-2">
                        Continue Reading <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <div className="space-y-4 pt-2">
                        <p className="text-xs text-zinc-600 italic font-serif">The archive waits unopened.</p>
                        <Link href="/library" className="glass-panel w-full py-4 text-[9px] flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-all border-white/5">
                          Enter Library <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Listening */}
                  <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/60 space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Audio Whispers</p>
                          <h4 className="text-lg text-white font-serif italic">The Echoes of Oz</h4>
                       </div>
                       <Headphones className="w-5 h-5 text-red-500" />
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex justify-between text-[8px] uppercase tracking-widest text-zinc-500 font-black">
                          <span>Listening</span>
                          <span>{book1Listen}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600" style={{ width: `${book1Listen}%` }} />
                       </div>
                    </div>

                    {book1Listen > 0 ? (
                      <Link href="/library/book-1/audio/ch-0" className="premium-button bg-red-950/20 border-red-500/30 text-red-500 w-full py-4 text-[9px] flex items-center justify-center gap-2">
                        Continue Listening <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <div className="space-y-4 pt-2">
                        <p className="text-xs text-zinc-600 italic font-serif">No whispers have been heard yet.</p>
                        <Link href="/library" className="glass-panel w-full py-4 text-[9px] flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-all border-white/5">
                          Open Audiobooks <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* 7. Trading / Bazaar Activity Summary */}
              <section className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/60 flex items-center gap-3">
                    <ArrowLeftRight className="w-4 h-4" /> Bazaar & Trade Activity
                  </h2>
                  <div className="group/help relative">
                    <Info className="w-3.5 h-3.5 text-zinc-700 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-64 opacity-0 group-hover/help:opacity-100 pointer-events-none transition-all z-50">
                      <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                        The Bazaar is an open exchange for Shards. Direct Trading allows you to swap artifacts with friends or allies along the path.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/60 space-y-8">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Active Listings</p>
                         <p className="text-xl text-white font-serif italic">{listings.length}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Pending Trades</p>
                         <p className="text-xl text-white font-serif italic">{trades.filter(t => t.status === "pending").length}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <Link href="/marketplace" className="glass-panel w-full py-4 text-[9px] flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-all border-white/10 uppercase tracking-widest font-black">
                        Open Bazaar <Store className="w-3.5 h-3.5" />
                      </Link>
                      <Link href="/trading" className="glass-panel w-full py-4 text-[9px] flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-all border-white/10 uppercase tracking-widest font-black">
                        Sanctioned Trading <ArrowLeftRight className="w-3.5 h-3.5" />
                      </Link>
                   </div>

                   {listings.length === 0 && trades.length === 0 && (
                     <p className="text-xs text-zinc-700 italic font-serif text-center pt-4 border-t border-white/5">No exchanges recorded yet.</p>
                   )}
                </div>
              {/* 9. Account / Membership Panel */}
              <section className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/60 flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4" /> Path Membership
                  </h2>
                </div>

                <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/40 space-y-6 relative overflow-hidden">
                  <div className="space-y-2">
                    <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Authorized Email</p>
                    <p className="text-sm text-zinc-300 font-serif italic truncate">{user?.email}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-950 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-black">Status</span>
                       {profile?.membershipStatus === "paid" ? (
                         <span className="text-[8px] uppercase tracking-widest text-emerald-500 font-black flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Active</span>
                       ) : (
                         <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">Standard</span>
                       )}
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-black">Access Tier</span>
                       <span className="text-xs text-white font-serif italic">{profile?.membershipStatus === "paid" ? "Paid Member" : "Free Explorer"}</span>
                    </div>
                  </div>

                  {profile?.membershipStatus !== "paid" ? (
                    <button className="premium-button w-full py-5 text-[10px] uppercase tracking-[0.2em]">
                      Upgrade Membership
                    </button>
                  ) : (
                    <button className="glass-panel w-full py-5 text-[10px] uppercase tracking-[0.2em] border-white/10 text-zinc-500 hover:text-white">
                      Manage Subscription
                    </button>
                  )}
                </div>
              </section>

              {/* 10. Affiliate / Referral Network */}
              <section className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/60 flex items-center gap-3">
                    <Users className="w-4 h-4" /> Pathwalker Network
                  </h2>
                  <div className="group/help relative">
                    <Info className="w-3.5 h-3.5 text-zinc-700 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-64 opacity-0 group-hover/help:opacity-100 pointer-events-none transition-all z-50">
                      <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                        Become an official Pathwalker and earn Yellow Shards and commissions for bringing others to the Yellow Path.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-black/40 space-y-8 relative overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Zap className="w-6 h-6 text-primary" />
                       </div>
                       <div>
                          <h4 className="text-white font-serif italic">Your Referral Code</h4>
                          <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600">Share with other spirits</p>
                       </div>
                    </div>
                    
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-between group">
                       <span className="text-xl text-primary font-serif italic tracking-tighter uppercase">{profile?.referralCode || "OZ-JOURNAL-UNSET"}</span>
                       <button className="p-2 rounded-lg bg-white/5 hover:bg-primary hover:text-black transition-all">
                          <ArrowRight className="w-4 h-4" />
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                       <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Path Signups</p>
                       <p className="text-xl text-white font-serif italic">{profile?.referralCount || 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                       <p className="text-[7px] uppercase tracking-widest text-zinc-600 font-black">Shard Rewards</p>
                       <p className="text-xl text-primary font-serif italic">{profile?.referralEarnings || 0}</p>
                    </div>
                  </div>

                  <button className="premium-button w-full py-4 text-[9px] uppercase tracking-widest flex items-center justify-center gap-3">
                    <BadgeCheck className="w-4 h-4" /> Open Affiliate Portal
                  </button>
                </div>
              </section>
              </section>



            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
