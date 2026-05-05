"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { MASTER_CARDS, Rarity } from "@/constants/cards";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, 
  Filter, 
  Search, 
  Coins, 
  Plus, 
  Tag, 
  ChevronRight,
  Info,
  X,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Scroll
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BetaNotice } from "@/components/shared/BetaNotice";
import Link from "next/link";

const RARITY_COLORS: Record<string, string> = {
  Starter: "text-zinc-400",
  Common: "text-zinc-100",
  Uncommon: "text-emerald-400",
  Rare: "text-blue-400",
  Epic: "text-purple-400",
  Legendary: "text-amber-400",
  Founder: "text-yellow-500",
};

export default function MarketplacePage() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [filter, setFilter] = useState({ rarity: "all", book: "all" });

  useEffect(() => {
    // Safety timeout to clear loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const listingsRef = collection(db, "marketplace");
    let q = query(listingsRef, where("status", "==", "active"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, 
      (snap) => {
        setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
        clearTimeout(timeout);
      },
      (error) => {
        console.error("Marketplace sync error:", error);
        // If query fails (likely due to missing index), fallback to simpler query
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
          console.warn("Retrying with simple query (missing index?)...");
          const simpleQ = query(listingsRef, where("status", "==", "active"));
          onSnapshot(simpleQ, (s) => {
            setListings(s.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
            clearTimeout(timeout);
          });
        } else {
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    );

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="glass-panel p-12 text-center max-w-md rounded-3xl border-white/5 bg-zinc-950/40">
            <Shield className="w-16 h-16 text-amber-500/20 mx-auto mb-6" />
            <h2 className="text-3xl font-serif italic text-white mb-4">The Bazaar is Foggy</h2>
            <p className="text-zinc-500 mb-8 italic">Only those who have walked the Yellow Path may trade here. Please sign in to access the exchange.</p>
            <Link href="/login" className="premium-button block w-full text-center">Sign In</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading && listings.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="font-serif italic text-amber-500/60 animate-pulse text-xl">Opening the Bazaar Gates...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        <div className="p-8 max-w-7xl mx-auto space-y-16">
          {/* Header Section */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 relative pt-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-amber-500/60 bg-amber-500/5 px-4 py-1.5 rounded-full border border-amber-500/10 backdrop-blur-xl w-fit">
                <Scroll className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-black">The Grand Bazaar</span>
              </div>
              <div className="space-y-2">
                <h1 className="font-serif text-6xl md:text-8xl gold-gradient-text italic tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                  Shard Exchange
                </h1>
                <p className="text-zinc-500 text-lg font-serif italic max-w-xl">
                  Trade legendary artifacts for Yellow Shards with other Pathwalkers in the cinematic archives of Oz.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-6 w-full lg:w-auto"
            >
              <div className="glass-panel px-10 py-6 flex items-center gap-8 border-amber-500/20 bg-amber-500/5 shadow-[0_0_40px_rgba(251,191,36,0.05)]">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/40 blur-xl rounded-full animate-pulse" />
                  <div className="relative w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30">
                    <Coins className="w-7 h-7 text-amber-500" />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.3em] leading-none mb-2">Your Balance</p>
                  <p className="text-4xl text-amber-500 font-serif italic tracking-wide">{profile?.yellowShards || 0}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsListingModalOpen(true)}
                className="premium-button px-12 py-6 flex items-center gap-4 group h-full"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[12px] uppercase tracking-[0.3em] font-black">List an Artifact</span>
              </button>
            </motion.div>
          </header>

          {/* Search & Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-3 flex flex-col md:flex-row items-center gap-4 border-white/5 bg-white/5 backdrop-blur-3xl rounded-[2rem]"
          >
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
              <input 
                type="text" 
                placeholder="Seek a specific card by name..."
                className="w-full bg-black/40 border border-white/5 text-base px-16 py-5 rounded-[1.5rem] focus:border-amber-500/30 outline-none transition-all placeholder:text-zinc-700 text-zinc-300 font-serif italic"
              />
            </div>
            
            <div className="flex gap-4 w-full md:w-auto pr-2">
              <div className="relative group">
                <select 
                  value={filter.rarity}
                  onChange={(e) => setFilter({...filter, rarity: e.target.value})}
                  className="appearance-none bg-black/40 border border-white/5 text-[11px] uppercase tracking-[0.3em] font-black px-10 py-5 pr-16 rounded-[1.5rem] focus:border-amber-500/30 outline-none transition-all cursor-pointer hover:bg-black/60 text-zinc-400"
                >
                  <option value="all">All Rarities</option>
                  {Object.keys(RARITY_COLORS).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Filter className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none group-hover:text-amber-500 transition-colors" />
              </div>
            </div>
          </motion.div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {loading ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} className="aspect-[2/3] glass-panel animate-pulse bg-white/5 border-white/5 rounded-[2rem]" />
              ))
            ) : listings.length === 0 ? (
              <div className="col-span-full py-48 text-center space-y-10">
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 bg-zinc-500/10 blur-[60px] rounded-full" />
                  <div className="relative w-full h-full bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <Store className="w-12 h-12 text-zinc-700" />
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-zinc-400 italic font-serif text-3xl">The market stalls are silent.</p>
                  <p className="text-zinc-600 text-base max-w-md mx-auto uppercase tracking-widest font-black">Be the first to list a card or check back after the next fog lifts.</p>
                </div>
              </div>
            ) : (
              listings.map((listing, idx) => (
                <ListingCard key={listing.id} listing={listing} currentUserId={user.uid} index={idx} />
              ))
            )}
          </div>
          <BetaNotice />
        </div>

        <AnimatePresence>
          {isListingModalOpen && (
            <ListCardModal onClose={() => setIsListingModalOpen(false)} user={user} />
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

function ListingCard({ listing, currentUserId, index }: { listing: any; currentUserId: string; index: number }) {
  const master = MASTER_CARDS.find(m => m.cardId === listing.cardId);
  const [isBuying, setIsBuying] = useState(false);

  const handleBuy = async () => {
    if (isBuying) return;
    if (!confirm(`Confirm purchase of ${master?.name} for ${listing.price} Yellow Shards?`)) return;
    
    setIsBuying(true);
    try {
      const response = await fetch(`/api/marketplace/buy/${listing.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert("Purchase successful!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 5) * 0.1, duration: 0.8 }}
      className="group relative"
    >
      <div className="absolute -inset-4 bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-[3rem]" />
      
      <div className="glass-panel p-4 overflow-hidden relative flex flex-col border-white/5 group-hover:border-amber-500/30 transition-all duration-500 hover:translate-y-[-8px] rounded-[2.5rem] bg-zinc-950/40">
        <div className="aspect-[2/3] relative rounded-[1.5rem] overflow-hidden mb-6 shadow-2xl">
          <img 
            src={master?.imageUrl || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-80 group-hover:opacity-100"
            alt={master?.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
          
          <div className={cn(
            "absolute top-4 left-4 px-4 py-1.5 bg-black/80 backdrop-blur-2xl rounded-full text-[9px] uppercase font-black tracking-[0.3em] border border-white/10 shadow-2xl transition-all group-hover:scale-105",
            RARITY_COLORS[master?.rarity as Rarity] || "text-zinc-400"
          )}>
            {master?.rarity}
          </div>
        </div>

        <div className="px-3 space-y-2 mb-6 flex-1">
          <h3 className="text-2xl font-serif italic text-white group-hover:gold-gradient-text transition-all duration-300 line-clamp-1">
            {master?.name}
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 overflow-hidden shadow-inner">
              <span className="text-[8px] text-zinc-500 font-black">{listing.sellerName?.charAt(0)}</span>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Pathwalker: {listing.sellerName}</p>
          </div>
        </div>

        <div className="px-3 pt-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Asking Price</span>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
              <span className="text-2xl font-serif italic text-amber-500 tracking-tight">{listing.price}</span>
            </div>
          </div>

          {listing.sellerId !== currentUserId ? (
            <button 
              onClick={handleBuy}
              disabled={isBuying}
              className="premium-button py-3 px-8 text-[10px] uppercase font-black tracking-[0.25em] disabled:opacity-50 shadow-[0_0_20px_rgba(251,191,36,0.1)] active:scale-95"
            >
              {isBuying ? "Acquiring..." : "Acquire"}
            </button>
          ) : (
            <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500 italic">Your Stall</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ListCardModal({ onClose, user }: { onClose: () => void; user: any }) {
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      const snap = await getDocs(collection(db, "users", user.uid, "playerCards"));
      setCards(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((c: any) => {
        const isSaleLocked = c.saleUnlockDate && (c.saleUnlockDate.seconds * 1000 > Date.now());
        return !c.bound && !c.activeInCampaign && c.marketStatus !== "listed" && !isSaleLocked;
      }));
      setLoading(false);
    };
    fetchCards();
  }, [user.uid]);

  const handleList = async () => {
    if (!selectedCard || !price || isSubmitting) return;
    if (parseInt(price) < 1) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/marketplace/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          cardDocId: selectedCard.id,
          price: parseInt(price),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 40 }}
        className="w-full max-w-6xl glass-panel relative overflow-hidden flex flex-col md:flex-row max-h-[90vh] bg-zinc-950 border-white/10 rounded-[3rem]"
      >
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 z-30 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-zinc-500 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Selection Side */}
        <div className="w-full md:w-3/5 p-12 md:p-16 border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-5xl font-serif italic gold-gradient-text">Market Listing</h2>
              <p className="text-zinc-500 text-lg font-serif italic">Select an artifact from your vault to place in the grand exchange.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {loading ? (
                Array(6).fill(0).map((_, i) => <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-[2rem] border border-white/5" />)
              ) : cards.length === 0 ? (
                <div className="col-span-full py-24 glass-panel bg-white/5 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12 rounded-[2.5rem]">
                  <Shield className="w-16 h-16 text-zinc-800 mb-6" />
                  <p className="text-zinc-500 italic font-serif text-xl">No trade-ready artifacts found in your vault.</p>
                </div>
              ) : (
                cards.map((card) => {
                  const master = MASTER_CARDS.find(m => m.cardId === card.cardId);
                  const isSelected = selectedCard?.id === card.id;
                  return (
                    <motion.button 
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      whileHover={{ y: -8 }}
                      className={cn(
                        "relative aspect-[2/3] rounded-[2rem] overflow-hidden border-2 transition-all duration-500 group",
                        isSelected ? "border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.3)] scale-[1.02]" : "border-white/5 hover:border-amber-500/30"
                      )}
                    >
                      <img src={master?.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6 text-left space-y-1">
                        <p className={cn("text-[8px] uppercase font-black tracking-[0.3em] mb-1", RARITY_COLORS[master?.rarity as Rarity])}>{master?.rarity}</p>
                        <p className="text-sm text-white font-serif italic leading-tight line-clamp-2">{master?.name}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-2xl border-2 border-black">
                          <Zap className="w-4 h-4 text-black fill-current" />
                        </div>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Pricing Side */}
        <div className="w-full md:w-2/5 p-12 md:p-16 bg-black/40 space-y-12">
          <div className="space-y-8">
            <h3 className="text-2xl font-serif italic text-white flex items-center gap-4">
              <Tag className="w-6 h-6 text-amber-500" />
              Listing Details
            </h3>
            
            <div className="space-y-4">
              <label className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.4em]">Shard Asking Price</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-amber-500/10 rounded-2xl group-focus-within:bg-amber-500/20 transition-all border border-amber-500/10 group-focus-within:border-amber-500/30">
                  <Coins className="w-6 h-6 text-amber-500" />
                </div>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0000"
                  className="w-full bg-zinc-950 border border-white/10 rounded-[2rem] py-8 pl-20 pr-8 text-4xl font-serif italic text-amber-500 focus:border-amber-500/50 outline-none transition-all placeholder:text-zinc-900 shadow-inner"
                />
              </div>
            </div>

            <div className="glass-panel p-8 bg-white/5 space-y-6 border-white/10 rounded-[2rem]">
              <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest">
                <span className="text-zinc-500">Bazaar Tax (7.5%)</span>
                <span className="text-red-500/60 font-mono">-{price ? (parseInt(price) * 0.075).toFixed(1) : "0.0"}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-white font-black uppercase tracking-[0.3em]">Expected Yield</span>
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6 text-amber-500" />
                  <span className="text-4xl text-amber-500 font-serif italic drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">{price ? (parseInt(price) * 0.925).toFixed(1) : "0.0"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] backdrop-blur-xl">
              <Info className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
              <p className="text-xs text-zinc-500 leading-relaxed italic font-serif">
                Listed artifacts are transferred to the Bazaar escrow. They cannot be used in campaign trials or binding ceremonies until the listing is revoked or fulfilled.
              </p>
            </div>

            <button 
              onClick={handleList}
              disabled={!selectedCard || !price || isSubmitting}
              className="w-full premium-button group py-6 flex items-center justify-center gap-4 text-[12px] uppercase tracking-[0.4em] font-black disabled:opacity-50 rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all"
            >
              <span>{isSubmitting ? "Sealing the Scroll..." : "Publish to Bazaar"}</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
