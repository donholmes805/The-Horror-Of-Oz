"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { MASTER_CARDS, MasterCard, Rarity, CardType } from "@/constants/cards";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { 
  Search, Filter, Info, ArrowLeftRight, Store, BookOpen, Clock, Zap, Shield, 
  Sparkles, X, Scroll, ArrowRight, LayoutGrid, ListFilter, AlertTriangle, 
  ChevronDown, Calendar, BadgeCheck, Unlock, Lock, Trash2, RotateCcw, History, 
  UserCheck, Briefcase, Star, Heart, Eye, Compass, Skull, RefreshCw, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const RARITY_COLORS: Record<Rarity, string> = {
  Starter: "text-[#b8860b]", // Muted Gold
  Common: "text-zinc-400", // Steel Gray
  Uncommon: "text-[#4d5d53]", // Green Bronze
  Rare: "text-[#00c2ff]", // Blue/Gold
  Epic: "text-[#9d00ff]", // Purple/Crimson
  Legendary: "text-[#ffcc00]", // Bright Gold
  Founder: "text-[#ff003c]", // Black/Gold Premium
};

const RARITY_GLOWS: Record<Rarity, string> = {
  Starter: "shadow-gold/20",
  Common: "shadow-white/10",
  Uncommon: "shadow-emerald-900/20",
  Rare: "shadow-blue-500/30",
  Epic: "shadow-purple-600/40",
  Legendary: "shadow-amber-400/60",
  Founder: "shadow-red-600/70",
};

const RARITY_BORDERS: Record<Rarity, string> = {
  Starter: "border-amber-900/30",
  Common: "border-zinc-800",
  Uncommon: "border-emerald-900/30",
  Rare: "border-blue-900/40",
  Epic: "border-purple-900/50",
  Legendary: "border-amber-500/40",
  Founder: "border-red-600/50",
};

export default function CardCollection() {
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<Rarity | "All">("All");
  const [selectedType, setSelectedType] = useState<CardType | "All">("All");
  const [selectedBook, setSelectedBook] = useState<string>("All");
  const [tradeFilter, setTradeFilter] = useState<"All" | "Tradeable" | "Locked">("All");
  const [saleFilter, setSaleFilter] = useState<"All" | "Sellable" | "Locked">("All");
  
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const stats = {
    total: userCards.length,
    legendary: userCards.filter(c => c.rarity === "Legendary" || c.rarity === "Founder").length,
    locked: userCards.filter(c => (c.tradeUnlockDate?.seconds * 1000 > Date.now()) || c.bound).length,
    tradeable: userCards.filter(c => c.tradeable && (!c.tradeUnlockDate || c.tradeUnlockDate.seconds * 1000 <= Date.now()) && !c.bound).length,
    sellable: userCards.filter(c => c.sellable && (!c.saleUnlockDate || c.saleUnlockDate.seconds * 1000 <= Date.now()) && !c.bound).length,
    founder: userCards.filter(c => c.rarity === "Founder").length,
  };

  useEffect(() => {
    if (!user) return;

    // Safety timeout to clear loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const q = query(collection(db, "users", user.uid, "playerCards"), orderBy("acquiredAt", "desc"));
    const unsub = onSnapshot(q, 
      (snap) => {
        const cards = snap.docs.map(d => {
          const data = d.data();
          const master = MASTER_CARDS.find(m => m.cardId === data.cardId);
          return { ...data, ...master, id: d.id };
        });
        setUserCards(cards);
        setLoading(false);
        setError(false);
        clearTimeout(timeout);
      },
      (error) => {
        console.error("Cards vault sync error:", error);
        setError(true);
        setLoading(false);
        clearTimeout(timeout);
      }
    );

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [user]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedRarity("All");
    setSelectedType("All");
    setSelectedBook("All");
    setTradeFilter("All");
    setSaleFilter("All");
  };

  const filteredCards = userCards.filter(card => {
    const matchesSearch = card.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = selectedRarity === "All" || card.rarity === selectedRarity;
    const matchesType = selectedType === "All" || card.type === selectedType;
    const matchesBook = selectedBook === "All" || card.book === selectedBook;
    
    const isTradeLocked = card.tradeUnlockDate?.seconds * 1000 > Date.now() || card.bound;
    const matchesTrade = tradeFilter === "All" || (tradeFilter === "Tradeable" ? !isTradeLocked : isTradeLocked);
    
    const isSaleLocked = card.saleUnlockDate?.seconds * 1000 > Date.now() || card.bound;
    const matchesSale = saleFilter === "All" || (saleFilter === "Sellable" ? !isSaleLocked : isSaleLocked);

    return matchesSearch && matchesRarity && matchesType && matchesBook && matchesTrade && matchesSale;
  });

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="glass-panel p-12 text-center max-w-md rounded-3xl border-red-500/20 bg-zinc-950/40">
            <AlertTriangle className="w-16 h-16 text-red-500/40 mx-auto mb-6" />
            <h2 className="text-3xl font-serif italic text-white mb-4">The Vault could not be opened</h2>
            <p className="text-zinc-500 mb-8 italic">An arcane error prevents access to your grimoires. The connection to the Oz Network is unstable.</p>
            <div className="flex gap-4">
               <button onClick={() => window.location.reload()} className="flex-1 premium-button bg-red-950/20 border-red-500/30 text-red-500">Retry</button>
               <Link href="/dashboard" className="flex-1 glass-panel py-4 text-zinc-500 hover:text-white transition-all text-sm uppercase tracking-widest font-black">Dashboard</Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 md:space-y-20 pt-24 md:pt-32">
          
          {/* Gothic Header HUD */}
          <header className="space-y-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6 max-w-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(200,155,44,0.1)]">
                    <History className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-serif text-5xl md:text-7xl gold-gradient-text italic tracking-tighter leading-none">
                      The Vault
                    </h1>
                    <p className="text-zinc-500 text-sm md:text-lg italic font-serif mt-2">Artifacts, allies, relics, and horrors collected along the Yellow Path.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="glass-panel px-5 py-2.5 rounded-full border-primary/20 bg-black/60 flex items-center gap-3 shadow-lg">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-lg font-serif italic text-white leading-none">{profile?.yellowShards || 0}</span>
                    <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-black">Yellow Shards</span>
                  </div>
                  {userCards.some(c => c.variant === "Starter Earned") && (
                    <div className="glass-panel px-5 py-2.5 rounded-full border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3 shadow-lg">
                      <BadgeCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-[8px] uppercase tracking-[0.2em] text-emerald-500 font-black">Starter Reward Claimed</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Search */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full lg:w-96 glass-panel p-2 rounded-[2rem] border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl"
              >
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700" />
                  <input 
                    type="text"
                    placeholder="Seek an artifact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none rounded-[1.5rem] py-5 pl-16 pr-6 text-base text-zinc-200 focus:ring-0 outline-none placeholder:text-zinc-800 font-serif italic"
                  />
                </div>
              </motion.div>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Artifacts", value: stats.total, icon: <LayoutGrid className="w-4 h-4" />, color: "text-zinc-100", bg: "bg-white/5", tooltip: "Total unique relics, allies, and horrors claimed from the Yellow Path." },
                { label: "Legendary & Rare", value: stats.legendary, icon: <Sparkles className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-500/10", tooltip: "High-value artifacts with unique powers and cinematic rarity." },
                { label: "Vault Locked", value: stats.locked, icon: <Lock className="w-4 h-4" />, color: "text-red-500", bg: "bg-red-500/10", tooltip: "Artifacts currently soulbound, campaign-active, or under initial trade lock." },
                { label: "Sanctioned Trade", value: stats.tradeable, icon: <ArrowLeftRight className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/10", tooltip: "Artifacts eligible for peer-to-peer exchange with other Pathwalkers." },
                { label: "Market Ready", value: stats.sellable, icon: <Store className="w-4 h-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10", tooltip: "Verified artifacts that can be listed for Yellow Shards in the Bazaar." },
                { label: "Founder Items", value: stats.founder, icon: <History className="w-4 h-4" />, color: "text-red-600", bg: "bg-red-600/10", tooltip: "Ultra-rare artifacts reserved for early explorers and supporters of Oz." },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel p-6 rounded-[2rem] border-white/5 bg-black/60 flex flex-col gap-4 shadow-xl group hover:border-primary/20 transition-all relative"
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <div className="relative group/tooltip">
                        <Info className="w-3 h-3 text-zinc-600" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all z-50">
                           <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                              {stat.tooltip}
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", stat.bg, stat.color)}>
                    {stat.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">{stat.label}</p>
                    <p className={cn("text-3xl font-serif italic leading-none", stat.color)}>{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-3 glass-panel px-6 py-3 rounded-full border-white/10 hover:border-primary/40 text-zinc-400 hover:text-primary transition-all text-[10px] uppercase tracking-[0.2em] font-black"
                >
                  <ListFilter className="w-4 h-4" />
                  {isFilterOpen ? "Hide Grimoires" : "Filter Archives"}
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isFilterOpen && "rotate-180")} />
                </button>
                {(searchTerm || selectedRarity !== "All" || selectedType !== "All" || selectedBook !== "All" || tradeFilter !== "All" || saleFilter !== "All") && (
                  <button 
                    onClick={resetFilters}
                    className="flex items-center gap-2 text-red-500/60 hover:text-red-500 text-[9px] uppercase tracking-widest font-black transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Path
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                      <div className="space-y-3">
                        <label className="text-[8px] uppercase tracking-widest text-zinc-600 font-black ml-4">Rarity Tier</label>
                        <select 
                          value={selectedRarity}
                          onChange={(e) => setSelectedRarity(e.target.value as any)}
                          className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-3 px-6 text-[10px] uppercase tracking-widest font-black text-zinc-400 focus:border-primary/50 outline-none appearance-none"
                        >
                          <option value="All">All Rarities</option>
                          <option value="Starter">Starter</option>
                          <option value="Common">Common</option>
                          <option value="Uncommon">Uncommon</option>
                          <option value="Rare">Rare</option>
                          <option value="Epic">Epic</option>
                          <option value="Legendary">Legendary</option>
                          <option value="Founder">Founder</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[8px] uppercase tracking-widest text-zinc-600 font-black ml-4">Artifact Type</label>
                        <select 
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value as any)}
                          className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-3 px-6 text-[10px] uppercase tracking-widest font-black text-zinc-400 focus:border-primary/50 outline-none appearance-none"
                        >
                          <option value="All">All Types</option>
                          <option value="Character">Character</option>
                          <option value="Ally">Ally</option>
                          <option value="Enemy">Enemy</option>
                          <option value="Relic">Relic</option>
                          <option value="Location">Location</option>
                          <option value="Curse">Curse</option>
                          <option value="Key">Key</option>
                          <option value="Story">Story</option>
                          <option value="Boss">Boss</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[8px] uppercase tracking-widest text-zinc-600 font-black ml-4">Book Origin</label>
                        <select 
                          value={selectedBook}
                          onChange={(e) => setSelectedBook(e.target.value)}
                          className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-3 px-6 text-[10px] uppercase tracking-widest font-black text-zinc-400 focus:border-primary/50 outline-none appearance-none"
                        >
                          <option value="All">All Books</option>
                          <option value="Book I">Book I</option>
                          <option value="Book II">Book II</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[8px] uppercase tracking-widest text-zinc-600 font-black ml-4">Trade Sanction</label>
                        <select 
                          value={tradeFilter}
                          onChange={(e) => setTradeFilter(e.target.value as any)}
                          className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-3 px-6 text-[10px] uppercase tracking-widest font-black text-zinc-400 focus:border-primary/50 outline-none appearance-none"
                        >
                          <option value="All">All Sanctions</option>
                          <option value="Tradeable">Sanctioned</option>
                          <option value="Locked">Vault Locked</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[8px] uppercase tracking-widest text-zinc-600 font-black ml-4">Market Status</label>
                        <select 
                          value={saleFilter}
                          onChange={(e) => setSaleFilter(e.target.value as any)}
                          className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-3 px-6 text-[10px] uppercase tracking-widest font-black text-zinc-400 focus:border-primary/50 outline-none appearance-none"
                        >
                          <option value="All">All Status</option>
                          <option value="Sellable">Market Ready</option>
                          <option value="Locked">Market Restricted</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* Card Grid */}
          {filteredCards.length === 0 ? (
            <div className="py-48 text-center space-y-10">
              <div className="relative w-40 h-40 mx-auto">
                <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full animate-pulse" />
                <div className="relative w-full h-full bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-3xl">
                  {userCards.length === 0 ? <Scroll className="w-16 h-16 text-zinc-800" /> : <Compass className="w-16 h-16 text-zinc-800" />}
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-zinc-400 italic font-serif text-4xl">
                  {userCards.length === 0 ? "The Vault is Empty" : "The Archives are Silent"}
                </p>
                <p className="text-zinc-600 text-sm max-w-sm mx-auto uppercase tracking-widest font-black leading-relaxed">
                  {userCards.length === 0 
                    ? "The Yellow Path awaits those bold enough to claim its secrets. Your first artifact is out there, hidden within the Red Country." 
                    : "No artifacts match your current search criteria. Adjust your filters or clear your grimoires to reveal your collection."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  {userCards.length === 0 ? (
                    <Link href="/campaign" className="premium-button px-10 py-5 text-xs">Walk the Yellow Path</Link>
                  ) : (
                    <button onClick={resetFilters} className="premium-button px-10 py-5 text-xs">Clear Filter Grimoires</button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
              {filteredCards.map((card, index) => {
                const isTradeLocked = card.tradeUnlockDate?.seconds * 1000 > Date.now();
                const isSaleLocked = card.saleUnlockDate?.seconds * 1000 > Date.now();
                const isBound = card.bound || card.variant === "Starter Earned";

                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % 5) * 0.05 }}
                    whileHover={{ y: -15, scale: 1.02 }}
                    onClick={() => setSelectedCard(card)}
                    className="group relative cursor-pointer"
                  >
                    {/* Premium Rarity Glow */}
                    <div className={cn(
                      "absolute -inset-4 rounded-[3.5rem] opacity-0 group-hover:opacity-100 blur-[40px] transition-all duration-700 z-0",
                      RARITY_GLOWS[card.rarity as Rarity]
                    )} />

                    <div className={cn(
                      "relative aspect-[2/3] rounded-[3rem] overflow-hidden border backdrop-blur-3xl shadow-2xl bg-zinc-950/60 p-4 transition-all duration-500",
                      RARITY_BORDERS[card.rarity as Rarity],
                      "group-hover:border-primary/40"
                    )}>
                      <div className="w-full h-full relative rounded-[2.2rem] overflow-hidden bg-black/40">
                        {/* Card Image with Gothic Mask */}
                        {card.approvedForPublicUse ? (
                          <img 
                            src={card.imageUrl || "/placeholder-card.png"} 
                            alt={card.name}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-950 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-all duration-1000">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.8)_100%)] z-10" />
                             {/* Gothic Silhouette Mockup */}
                             <motion.div 
                               initial={{ opacity: 0.3 }}
                               animate={{ opacity: [0.3, 0.5, 0.3] }}
                               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                               className="relative z-0"
                             >
                               <Users className="w-24 h-24 text-zinc-900 group-hover:text-primary/20 transition-colors duration-1000" />
                             </motion.div>
                             <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent z-20" />
                             <div className="absolute inset-0 flex flex-col items-center justify-center z-30 opacity-40 group-hover:opacity-100 transition-opacity">
                               <Lock className="w-6 h-6 text-primary mb-2 opacity-20" />
                               <span className="text-[7px] uppercase font-black tracking-[0.4em] text-primary/40">Art Pending Approval</span>
                             </div>
                          </div>
                        )}
                        
                        {/* Overlay Layers */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-60 transition-opacity" />
                        
                        {/* Card Identity Overlay */}
                        <div className="absolute bottom-0 left-0 w-full p-6 space-y-3 z-10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]", RARITY_COLORS[card.rarity as Rarity])} />
                              <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", RARITY_COLORS[card.rarity as Rarity])}>
                                {card.rarity}
                              </span>
                            </div>
                            <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest">{card.type}</span>
                          </div>
                          <h3 className="text-white font-serif text-lg leading-tight italic group-hover:text-primary transition-colors line-clamp-2 drop-shadow-lg">
                            {card.name}
                          </h3>
                        </div>

                        {/* Status Ribbon/Icons */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                          {isBound && (
                            <div className="p-2.5 bg-black/60 rounded-xl backdrop-blur-2xl border border-white/10 shadow-2xl">
                              <Unlock className="w-3.5 h-3.5 text-zinc-500 opacity-50" />
                            </div>
                          )}
                          {(isTradeLocked || isSaleLocked) && !isBound && (
                            <div className="p-2.5 bg-black/60 rounded-xl backdrop-blur-2xl border border-amber-500/20 shadow-2xl">
                              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            </div>
                          )}
                          {card.activeInCampaign && (
                            <div className="p-2.5 bg-primary/10 rounded-xl backdrop-blur-2xl border border-primary/40 shadow-2xl">
                              <Compass className="w-3.5 h-3.5 text-primary" />
                            </div>
                          )}
                        </div>

                        {/* Edition Badge */}
                        {card.editionNumber && (
                          <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 rounded-lg backdrop-blur-2xl border border-white/10 text-[8px] text-zinc-400 font-black tracking-widest">
                            #{card.editionNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Source Tag below card */}
                    <div className="mt-4 px-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-[7px] uppercase font-black tracking-widest text-zinc-600">{card.source || "Vault Item"}</span>
                      {isBound && <span className="text-[7px] uppercase font-black tracking-widest text-red-500/60">Soulbound</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Card Detail Modal */}
          <AnimatePresence>
            {selectedCard && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 overflow-hidden">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedCard(null)}
                  className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
                />
                
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 100 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 100 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="w-full max-w-6xl glass-panel overflow-hidden relative grid grid-cols-1 lg:grid-cols-2 h-full md:h-auto md:max-h-[90vh] bg-zinc-950/95 border-white/10 rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,1)]"
                  >
                    <button 
                      onClick={() => setSelectedCard(null)}
                      className="absolute top-8 right-8 z-50 p-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-zinc-500 hover:text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    {/* Card Visual Side */}
                    <div className="p-8 md:p-16 bg-black/60 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 relative overflow-hidden group">
                      {/* High-End Rarity Background Atmosphere */}
                      <div className={cn(
                        "absolute inset-0 opacity-20 blur-[150px] scale-150 transition-transform duration-[10s] group-hover:scale-110",
                        RARITY_COLORS[selectedCard.rarity as Rarity]
                      )} />
                      
                      <motion.div 
                        initial={{ rotateY: -25, scale: 0.8, opacity: 0 }}
                        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="relative z-10"
                      >
                        <div className={cn(
                          "absolute -inset-4 rounded-[3.5rem] blur-3xl opacity-30 group-hover:opacity-60 transition duration-1000",
                          RARITY_COLORS[selectedCard.rarity as Rarity]
                        )} />
                        <div className={cn(
                          "relative w-72 md:w-[450px] aspect-[2/3] rounded-[3rem] overflow-hidden border-2 shadow-[0_0_100px_rgba(0,0,0,1)]",
                          RARITY_BORDERS[selectedCard.rarity as Rarity]
                        )}>
                          {selectedCard.approvedForPublicUse ? (
                            <img 
                              src={selectedCard.imageUrl || "/placeholder-card.png"} 
                              alt={selectedCard.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
                               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.9)_100%)] z-10" />
                               <motion.div 
                                 initial={{ opacity: 0.2 }}
                                 animate={{ opacity: [0.2, 0.4, 0.2] }}
                                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                 className="relative z-0"
                               >
                                 <Users className="w-48 h-48 text-zinc-900" />
                               </motion.div>
                               <div className="absolute inset-0 flex flex-col items-center justify-center z-30 space-y-4">
                                 <div className="p-4 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-md">
                                   <Lock className="w-8 h-8 text-primary/40" />
                                 </div>
                                 <div className="text-center space-y-1">
                                   <p className="text-[10px] uppercase font-black tracking-[0.5em] text-primary/60">Public Art Pending</p>
                                   <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-serif italic">Subject to High Archivist Review</p>
                                 </div>
                               </div>
                            </div>
                          )}
                          <div className="absolute bottom-0 w-full bg-black/90 backdrop-blur-2xl p-8 border-t border-white/5 space-y-2">
                             <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500">
                               <span>{selectedCard.variant || "Standard"}</span>
                               <span>#{selectedCard.editionNumber || "???"}</span>
                             </div>
                             <div className={cn("h-1 w-full rounded-full opacity-30", RARITY_COLORS[selectedCard.rarity as Rarity])} style={{ background: 'currentColor' }} />
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Info Content Side */}
                    <div className="p-8 md:p-16 space-y-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_100%_100%,_rgba(184,134,11,0.05)_0%,_transparent_100%)]">
                      <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-4">
                          <span className={cn("px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.3em] border border-current/20 bg-current/10 shadow-lg", RARITY_COLORS[selectedCard.rarity as Rarity])}>
                            {selectedCard.rarity} Tier
                          </span>
                          <div className="h-px w-12 bg-white/10" />
                          <span className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-black">
                            {selectedCard.type}
                          </span>
                        </div>
                        
                        <h2 className="text-5xl md:text-7xl text-white font-serif italic gold-gradient-text leading-tight tracking-tighter drop-shadow-2xl">
                          {selectedCard.name}
                        </h2>
                        
                        <div className="flex flex-wrap items-center gap-6 text-zinc-500 text-[11px] font-black uppercase tracking-[0.3em]">
                          <span className="flex items-center gap-3"><BookOpen className="w-4 h-4 text-primary" /> {selectedCard.book}</span>
                          <div className="w-2 h-2 rounded-full bg-white/5 shadow-inner" />
                          <span className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-primary" /> {selectedCard.campaign}</span>
                        </div>
                      </div>

                      {/* Rare Artifact Warning */}
                      {(selectedCard.rarity === "Epic" || selectedCard.rarity === "Legendary" || selectedCard.rarity === "Founder") && (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-5 shadow-inner"
                        >
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Rare Artifact Alert</p>
                            <p className="text-xs text-zinc-500 italic font-serif">Confirm all intentions before unsealing this artifact for trade or sale.</p>
                          </div>
                        </motion.div>
                      )}

                      <div className="space-y-12">
                        <div className="glass-panel p-10 bg-white/[0.03] border-white/5 rounded-[2.5rem] space-y-6 relative group overflow-hidden shadow-2xl">
                          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="w-20 h-20 text-primary" />
                          </div>
                          <h4 className="text-[11px] text-primary font-black uppercase tracking-[0.5em] flex items-center gap-4">
                            <Zap className="w-4 h-4 fill-primary/20" /> Arcane Effect
                          </h4>
                          <p className="text-2xl text-zinc-200 italic font-serif leading-relaxed relative z-10">
                            "{selectedCard.gameplayEffect}"
                          </p>
                        </div>

                        <div className="space-y-6">
                          <h4 className="text-[11px] text-zinc-700 font-black uppercase tracking-[0.5em] flex items-center gap-3">
                            <Scroll className="w-4 h-4" /> The Forbidden Lore
                          </h4>
                          <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/40 via-primary/5 to-transparent rounded-full" />
                            <p className="text-2xl text-zinc-500 italic font-serif leading-relaxed pl-10 pr-6">
                              "{selectedCard.loreText}"
                            </p>
                          </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-12">
                          <div className="space-y-2">
                             <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black flex items-center gap-2"><History className="w-3.5 h-3.5" /> Acquired</p>
                             <p className="text-sm text-zinc-300 font-serif italic">{selectedCard.acquiredAt ? new Date(selectedCard.acquiredAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Before the Storm"}</p>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Origin</p>
                             <p className="text-sm text-zinc-300 font-serif italic">{selectedCard.source || "Unknown Encounter"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Actions */}
                      <div className="pt-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <button 
                            disabled={selectedCard.activeInCampaign}
                            className="premium-button premium-button-gold py-8 flex flex-col items-center justify-center gap-2 group disabled:grayscale disabled:opacity-30 rounded-3xl"
                          >
                            <div className="flex items-center gap-3">
                              <Compass className="w-6 h-6 group-hover:rotate-45 transition-transform" />
                              <span className="text-sm uppercase tracking-[0.3em] font-black">Bind to Path</span>
                            </div>
                            {selectedCard.activeInCampaign && <span className="text-[8px] uppercase tracking-widest opacity-60">Active in Campaign</span>}
                          </button>
                          
                          <div className="flex flex-col gap-3">
                            <button 
                              disabled={selectedCard.bound || (selectedCard.tradeUnlockDate?.seconds * 1000 > Date.now())}
                              className="glass-panel hover:bg-white/5 py-8 flex flex-col items-center justify-center gap-2 group transition-all border-white/10 disabled:opacity-40 disabled:grayscale rounded-3xl"
                            >
                              <div className="flex items-center gap-3">
                                <ArrowLeftRight className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                                <span className="text-sm uppercase tracking-[0.3em] font-black">Trade Scroll</span>
                              </div>
                              {selectedCard.bound && <span className="text-[8px] uppercase tracking-widest opacity-60">Soulbound artifact</span>}
                            </button>
                          </div>
                        </div>
                        
                        {/* Lock Status HUD */}
                        <div className="space-y-4">
                          {/* Trade Lock */}
                          <div className="flex items-center justify-between px-8 py-5 bg-black/40 rounded-[1.8rem] border border-white/5 text-[10px] uppercase tracking-[0.3em] font-black shadow-inner">
                            <span className="text-zinc-600 flex items-center gap-4">
                              <ArrowLeftRight className="w-4 h-4" /> 
                              Trade Sanction
                            </span>
                            <span className={cn(
                              (selectedCard.tradeUnlockDate?.seconds * 1000 > Date.now()) || selectedCard.bound ? "text-red-500/80" : "text-emerald-500"
                            )}>
                              {selectedCard.bound ? "Permanently Bound" : 
                               (selectedCard.tradeUnlockDate?.seconds * 1000 > Date.now()) ? 
                               `Locked for ${Math.ceil((selectedCard.tradeUnlockDate.seconds * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} Days` : 
                               "Sanctioned for Trade"}
                            </span>
                          </div>

                          {/* Sale Lock */}
                          <div className="flex items-center justify-between px-8 py-5 bg-black/40 rounded-[1.8rem] border border-white/5 text-[10px] uppercase tracking-[0.3em] font-black shadow-inner">
                            <span className="text-zinc-600 flex items-center gap-4">
                              <Store className="w-4 h-4" /> 
                              Market Permission
                            </span>
                            <span className={cn(
                              (selectedCard.saleUnlockDate?.seconds * 1000 > Date.now()) || selectedCard.bound ? "text-red-500/80" : "text-emerald-500"
                            )}>
                              {selectedCard.bound ? "Permanently Bound" : 
                               (selectedCard.saleUnlockDate?.seconds * 1000 > Date.now()) ? 
                               `Restricted for ${Math.ceil((selectedCard.saleUnlockDate.seconds * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} Days` : 
                               "Market Authorized"}
                            </span>
                          </div>

                          {selectedCard.variant === "Starter Earned" && (
                            <div className="px-8 py-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-center gap-4">
                              <Info className="w-4 h-4 text-amber-500" />
                              <p className="text-[9px] text-zinc-500 italic font-serif">Starter Earned artifacts are bound to your soul until the first campaign is completed.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
