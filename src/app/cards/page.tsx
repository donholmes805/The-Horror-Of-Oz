"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { MASTER_CARDS, MasterCard, Rarity, CardType } from "@/constants/cards";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Info, ArrowLeftRight, Store, BookOpen, Clock, Zap, Shield, Sparkles, X, Scroll, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { cn } from "@/lib/utils";

const RARITY_COLORS: Record<Rarity, string> = {
  Starter: "text-zinc-400",
  Common: "text-zinc-100",
  Uncommon: "text-emerald-400",
  Rare: "text-blue-400",
  Epic: "text-purple-400",
  Legendary: "text-amber-400",
  Founder: "text-yellow-500",
};

const RARITY_GLOWS: Record<Rarity, string> = {
  Starter: "shadow-zinc-500/10",
  Common: "shadow-zinc-100/10",
  Uncommon: "shadow-emerald-500/20",
  Rare: "shadow-blue-500/20",
  Epic: "shadow-purple-500/30",
  Legendary: "shadow-amber-500/40",
  Founder: "shadow-yellow-500/50",
};

export default function CardCollection() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<Rarity | "All">("All");
  const [selectedCard, setSelectedCard] = useState<MasterCard | any>(null);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Safety timeout to clear loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const q = collection(db, "users", user.uid, "playerCards");
    const unsub = onSnapshot(q, 
      (snap) => {
        const cards = snap.docs.map(d => {
          const data = d.data();
          const master = MASTER_CARDS.find(m => m.cardId === data.cardId);
          return { ...data, ...master, id: d.id };
        });
        setUserCards(cards);
        setLoading(false);
        clearTimeout(timeout);
      },
      (error) => {
        console.error("Cards vault sync error:", error);
        setLoading(false);
        clearTimeout(timeout);
      }
    );

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [user]);

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="glass-panel p-12 text-center max-w-md rounded-3xl border-white/5 bg-zinc-950/40">
            <Scroll className="w-16 h-16 text-amber-500/20 mx-auto mb-6" />
            <h2 className="text-3xl font-serif italic text-white mb-4">The Vault is Sealed</h2>
            <p className="text-zinc-500 mb-8 italic">Your legendary artifacts are kept under arcane lock. Please sign in to view your collection.</p>
            <Link href="/login" className="premium-button block w-full text-center">Sign In</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="font-serif italic text-amber-500/60 animate-pulse text-xl">Unsealing the Vaults...</p>
        </div>
      </MainLayout>
    );
  }

  const filteredCards = userCards.filter(card => {
    const matchesSearch = card.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = selectedRarity === "All" || card.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        <div className="p-8 max-w-7xl mx-auto space-y-16">
          
          {/* Header Section */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 pt-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-amber-500/60 bg-amber-500/5 px-4 py-1.5 rounded-full border border-amber-500/10 backdrop-blur-xl w-fit">
                <Scroll className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-black">The Forbidden Vault</span>
              </div>
              <div className="space-y-2">
                <h1 className="font-serif text-6xl md:text-8xl gold-gradient-text italic tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                  My Collection
                </h1>
                <div className="flex items-center gap-3 text-zinc-500 text-lg font-serif italic">
                  <Sparkles className="w-4 h-4 text-amber-500/40" />
                  <span>You possess <span className="text-white font-bold">{userCards.length}</span> legendary artifacts in your archive</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4 w-full lg:w-auto bg-white/5 p-3 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl"
            >
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <input 
                  type="text"
                  placeholder="Seek an artifact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-base text-zinc-200 focus:border-amber-500/50 outline-none transition-all placeholder:text-zinc-800 font-serif italic"
                />
              </div>
              <div className="relative">
                <select 
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value as Rarity | "All")}
                  className="appearance-none bg-black/40 border border-white/5 rounded-[1.5rem] py-5 pl-8 pr-16 text-[11px] uppercase tracking-[0.3em] font-black text-zinc-400 focus:border-amber-500/50 outline-none transition-all cursor-pointer hover:bg-black/60 shadow-inner"
                >
                  <option value="All">All Rarities</option>
                  {Object.keys(RARITY_COLORS).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Filter className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
              </div>
            </motion.div>
          </header>

          {/* Card Grid */}
          {filteredCards.length === 0 ? (
            <div className="py-48 text-center space-y-10">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-zinc-500/10 blur-[60px] rounded-full" />
                <div className="relative w-full h-full bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <BookOpen className="w-12 h-12 text-zinc-700" />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-zinc-400 italic font-serif text-3xl">Your archives are silent, Pathwalker.</p>
                <p className="text-zinc-600 text-base max-w-md mx-auto uppercase tracking-widest font-black leading-relaxed">No artifacts matching your search were found in the current grimoires.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
              {filteredCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index % 5) * 0.1, duration: 0.8 }}
                  whileHover={{ y: -12 }}
                  onClick={() => setSelectedCard(card)}
                  className="group relative cursor-pointer"
                >
                  {/* Card Glow Effect */}
                  <div className={cn(
                    "absolute -inset-4 rounded-[3rem] opacity-0 group-hover:opacity-100 blur-3xl transition-all duration-700",
                    RARITY_GLOWS[card.rarity as Rarity] || "shadow-amber-500/20"
                  )} />

                  <div className="relative aspect-[2/3] rounded-[2.5rem] overflow-hidden border border-white/5 group-hover:border-amber-500/40 transition-all duration-500 shadow-2xl bg-zinc-950/40 backdrop-blur-md p-3">
                    <div className="w-full h-full relative rounded-[1.8rem] overflow-hidden">
                      <img 
                        src={card.imageUrl} 
                        alt={card.name}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
                      />
                      
                      {/* Atmospheric Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                      
                      {/* Card Info Overlay */}
                      <div className="absolute bottom-0 left-0 w-full p-6 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor]", 
                            RARITY_COLORS[card.rarity as Rarity]
                          )} />
                          <span className={cn("text-[9px] font-black uppercase tracking-[0.3em]", RARITY_COLORS[card.rarity as Rarity])}>
                            {card.rarity}
                          </span>
                        </div>
                        <h3 className="text-white font-serif text-xl leading-tight italic group-hover:gold-gradient-text transition-all line-clamp-2">
                          {card.name}
                        </h3>
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {(card.tradeUnlockDate?.seconds * 1000 > Date.now()) && (
                          <div className="p-2.5 bg-black/60 rounded-xl backdrop-blur-2xl border border-white/10 group-hover:border-amber-500/40 transition-colors shadow-2xl">
                            <Clock className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
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
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 40 }}
                  className="w-full max-w-6xl glass-panel overflow-hidden relative grid grid-cols-1 lg:grid-cols-2 max-h-[90vh] bg-zinc-950 border-white/10 rounded-[3rem]"
                >
                  <button 
                    onClick={() => setSelectedCard(null)}
                    className="absolute top-8 right-8 z-30 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-zinc-500 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  {/* Card Visual Side */}
                  <div className="p-12 lg:p-16 bg-black/40 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className={cn(
                      "absolute inset-0 opacity-20 blur-[120px] scale-150",
                      RARITY_COLORS[selectedCard.rarity as Rarity]
                    )} />
                    
                    <motion.div 
                      initial={{ rotateY: -15, scale: 0.9 }}
                      animate={{ rotateY: 0, scale: 1 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="relative group perspective-1000"
                    >
                      <div className={cn(
                        "absolute -inset-2 rounded-3xl blur-2xl opacity-40 group-hover:opacity-80 transition duration-1000",
                        RARITY_COLORS[selectedCard.rarity as Rarity]
                      )} />
                      <div className="relative w-72 md:w-[400px] aspect-[2/3] rounded-[2.5rem] overflow-hidden border-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <img 
                          src={selectedCard.imageUrl} 
                          alt={selectedCard.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 w-full bg-black/80 backdrop-blur-2xl p-6 text-[11px] text-amber-500/80 font-serif text-center uppercase tracking-[0.5em] border-t border-white/5">
                          {selectedCard.variant || "Standard Edition"}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Info Content Side */}
                  <div className="p-12 lg:p-16 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-current/20 bg-current/5", RARITY_COLORS[selectedCard.rarity as Rarity])}>
                          {selectedCard.rarity}
                        </span>
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black">
                          {selectedCard.type} artifact
                        </span>
                      </div>
                      
                      <h2 className="text-5xl md:text-6xl text-white font-serif italic gold-gradient-text leading-none tracking-tighter">
                        {selectedCard.name}
                      </h2>
                      
                      <div className="flex flex-wrap items-center gap-6 text-zinc-500 text-[11px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-amber-500/40" /> {selectedCard.book}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span className="flex items-center gap-2.5"><Sparkles className="w-4 h-4 text-amber-500/40" /> {selectedCard.campaign}</span>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="glass-panel p-8 bg-white/[0.02] border-white/5 rounded-[2rem] space-y-4 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Zap className="w-16 h-16 text-amber-500" />
                        </div>
                        <h4 className="text-[11px] text-amber-500 font-black uppercase tracking-[0.4em] flex items-center gap-3">
                          <Zap className="w-4 h-4 fill-current" /> Mystical Properties
                        </h4>
                        <p className="text-lg text-zinc-300 italic font-serif leading-relaxed relative z-10">
                          "{selectedCard.gameplayEffect}"
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[11px] text-zinc-600 font-black uppercase tracking-[0.4em]">Vault Record</h4>
                        <p className="text-xl text-zinc-400 italic font-serif leading-relaxed px-6 border-l-4 border-amber-500/10">
                          "{selectedCard.loreText}"
                        </p>
                      </div>
                    </div>

                    <div className="pt-12 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <button className="premium-button group py-6 flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.3em] font-black shadow-2xl active:scale-95 transition-all">
                          <span>Bind to Path</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="glass-panel hover:bg-white/5 py-6 flex items-center justify-center gap-4 text-[11px] uppercase tracking-[0.3em] font-black text-zinc-500 hover:text-white transition-all border-white/10">
                          <span>Trade Scroll</span>
                          <ArrowLeftRight className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between px-8 py-5 bg-black/40 rounded-[1.5rem] border border-white/5 text-[10px] uppercase tracking-[0.3em] font-black shadow-inner">
                        <span className="text-zinc-600 flex items-center gap-3">
                          <Clock className="w-4 h-4" /> 
                          Vault Lock Status
                        </span>
                        <span className={cn(
                          selectedCard.tradeUnlockDate?.seconds * 1000 > Date.now() ? "text-amber-500" : "text-emerald-500"
                        )}>
                          {selectedCard.tradeUnlockDate?.seconds * 1000 > Date.now() ? "Active Until Phase 2" : "Sanctioned for Trade"}
                        </span>
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
