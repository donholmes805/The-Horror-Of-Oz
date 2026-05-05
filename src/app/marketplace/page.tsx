"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, getDocs, doc } from "firebase/firestore";
import { MASTER_CARDS, MasterCard, Rarity, CardType } from "@/constants/cards";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, Filter, Search, Coins, Plus, Tag, ChevronRight, Info, X, Sparkles, 
  Shield, Zap, ArrowRight, Scroll, Clock, AlertTriangle, ArrowLeftRight, 
  LayoutGrid, ListFilter, History, Briefcase, BadgeCheck, Compass, 
  ChevronDown, ArrowUpRight, ShoppingBag, Eye, Lock, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BetaNotice } from "@/components/shared/BetaNotice";
import Link from "next/link";

const RARITY_COLORS: Record<Rarity, string> = {
  Starter: "text-[#b8860b]",
  Common: "text-zinc-400",
  Uncommon: "text-[#4d5d53]",
  Rare: "text-[#00c2ff]",
  Epic: "text-[#9d00ff]",
  Legendary: "text-[#ffcc00]",
  Founder: "text-[#ff003c]",
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

export default function MarketplacePage() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Settings & Status
  const [settings, setSettings] = useState<any>(null);
  const [eligibleCount, setEligibleCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<Rarity | "All">("All");
  const [selectedType, setSelectedType] = useState<CardType | "All">("All");
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "rarity">("newest");

  useEffect(() => {
    if (!user) return;

    // Fetch system settings for marketplace status
    const settingsUnsub = onSnapshot(doc(db, "system", "settings"), (snap) => {
      setSettings(snap.data());
    });

    // Safety timeout to clear loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const listingsRef = collection(db, "marketplace");
    const q = query(listingsRef, where("status", "==", "active"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, 
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setListings(data);
        setLoading(false);
        setError(false);
        clearTimeout(timeout);
      },
      (error) => {
        console.error("Marketplace sync error:", error);
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
          const simpleQ = query(listingsRef, where("status", "==", "active"));
          onSnapshot(simpleQ, (s) => {
            setListings(s.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
            setError(false);
            clearTimeout(timeout);
          });
        } else {
          setError(true);
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    );

    // Fetch eligible cards count
    const fetchEligible = async () => {
      const snap = await getDocs(collection(db, "users", user.uid, "playerCards"));
      const count = snap.docs.filter(d => {
        const c = d.data();
        const isSaleLocked = c.saleUnlockDate && (c.saleUnlockDate.seconds * 1000 > Date.now());
        return !c.bound && !c.activeInCampaign && c.marketStatus !== "listed" && !isSaleLocked && c.variant !== "Starter Earned";
      }).length;
      setEligibleCount(count);
    };
    fetchEligible();

    return () => {
      unsub();
      settingsUnsub();
      clearTimeout(timeout);
    };
  }, [user]);

  const filteredListings = useMemo(() => {
    let result = listings.filter(l => {
      const master = MASTER_CARDS.find(m => m.cardId === l.cardId);
      if (!master) return false;

      const matchesSearch = master.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRarity = selectedRarity === "All" || master.rarity === selectedRarity;
      const matchesType = selectedType === "All" || master.type === selectedType;

      return matchesSearch && matchesRarity && matchesType;
    });

    // Sort result
    return result.sort((a, b) => {
      const masterA = MASTER_CARDS.find(m => m.cardId === a.cardId);
      const masterB = MASTER_CARDS.find(m => m.cardId === b.cardId);
      if (!masterA || !masterB) return 0;

      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "rarity") {
        const rarityOrder = ["Starter", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Founder"];
        return rarityOrder.indexOf(masterB.rarity) - rarityOrder.indexOf(masterA.rarity);
      }
      return b.createdAt?.seconds - a.createdAt?.seconds;
    });
  }, [listings, searchTerm, selectedRarity, selectedType, sortBy]);

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="glass-panel p-16 text-center max-w-xl rounded-[3rem] border-white/5 bg-zinc-950/60 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <Shield className="w-24 h-24 text-amber-500/20 mx-auto mb-10 group-hover:scale-110 transition-transform duration-700" />
            <h2 className="text-5xl font-serif italic text-white mb-6 tracking-tighter">The Bazaar is Foggy</h2>
            <p className="text-zinc-500 text-lg mb-12 italic font-serif leading-relaxed">Only those who have walked the Yellow Path may trade here. Please sign in to access the grand exchange.</p>
            <Link href="/login" className="premium-button block w-full text-center py-6 text-sm uppercase tracking-[0.4em] font-black">Sign In to Oz</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading && listings.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-10">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-amber-500/10 rounded-full" />
            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center space-y-4">
            <p className="font-serif italic text-amber-500/60 animate-pulse text-3xl">Unsealing the Bazaar Gates...</p>
            <p className="text-zinc-700 text-[10px] uppercase tracking-[0.5em] font-black">Validating Merchant Scrolls</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-10 p-8">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <div className="text-center space-y-6 max-w-md">
            <h2 className="text-4xl font-serif italic text-white">The Gates are Barred</h2>
            <p className="text-zinc-500 italic font-serif">The Keeper has restricted access to the Bazaar due to unstable magic in the region.</p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={() => window.location.reload()} className="premium-button px-10 py-5 text-xs">Retry Ritual</button>
              <Link href="/dashboard" className="glass-panel px-10 py-5 text-xs text-zinc-500 hover:text-white uppercase tracking-widest font-black border-white/10">Return to Safety</Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isMarketEnabled = settings?.marketplaceEnabled ?? true;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)]">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-12 lg:py-20 space-y-20">
          
          {/* Header Section */}
          <header className="space-y-16">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 text-amber-500/60 bg-amber-500/5 px-5 py-2 rounded-full border border-amber-500/10 backdrop-blur-3xl w-fit">
                    <Store className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-[0.5em] font-black">Yellow Shards Bazaar</span>
                  </div>
                  {isMarketEnabled ? (
                    <div className="flex items-center gap-3 text-emerald-500/60 bg-emerald-500/5 px-5 py-2 rounded-full border border-emerald-500/10 backdrop-blur-3xl w-fit">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-[0.5em] font-black">Open by the Keeper</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-red-500/60 bg-red-500/5 px-5 py-2 rounded-full border border-red-500/10 backdrop-blur-3xl w-fit">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-[0.5em] font-black">Closed by the Keeper</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h1 className="font-serif text-7xl md:text-9xl gold-gradient-text italic tracking-tighter leading-[0.85] drop-shadow-2xl">
                    Shard Exchange
                  </h1>
                  <p className="text-zinc-500 text-xl font-serif italic max-w-2xl leading-relaxed">
                    Trade value for relics, allies, horrors, and legends discovered along the Yellow Path. The Bazaar is the heartbeat of the Oz economy.
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full xl:w-auto">
                <StatCard label="Your Balance" value={profile?.yellowShards || 0} icon={<Coins />} color="text-amber-500" highlight tooltip="Your current wealth in Yellow Shards, used to acquire artifacts from the Bazaar." />
                <StatCard label="Active Listings" value={listings.length} icon={<ShoppingBag />} color="text-zinc-400" tooltip="Total artifacts currently being offered by other Pathwalkers in the grand exchange." />
                <StatCard label="Eligible Cards" value={eligibleCount} icon={<LayoutGrid />} color="text-zinc-400" tooltip="Artifacts in your Vault that are currently eligible for listing in the Bazaar." />
                <StatCard label="Bazaar Fee" value="7.5%" icon={<Shield />} color="text-zinc-500" tooltip="The Keeper's tax on every successful transaction. Ensure your yield is worth the trade." />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative group">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Seek an artifact by name..."
                  className="w-full bg-zinc-950/40 border border-white/5 text-xl px-20 py-8 rounded-[2.5rem] focus:border-amber-500/30 outline-none transition-all placeholder:text-zinc-800 text-zinc-300 font-serif italic shadow-2xl backdrop-blur-3xl"
                />
              </div>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "glass-panel px-10 py-8 flex items-center gap-4 transition-all duration-500 rounded-[2.5rem] border-white/5",
                    isFilterOpen ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "hover:bg-white/5 text-zinc-500 hover:text-white"
                  )}
                >
                  <Filter className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-[0.3em] font-black">Filters</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", isFilterOpen && "rotate-180")} />
                </button>

                <button 
                  onClick={() => isMarketEnabled && setIsListingModalOpen(true)}
                  disabled={!isMarketEnabled}
                  className="premium-button px-12 py-8 flex items-center gap-4 group h-full disabled:opacity-30 disabled:grayscale rounded-[2.5rem]"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="text-xs uppercase tracking-[0.4em] font-black">List Artifact</span>
                </button>
              </div>
            </div>

            {/* Collapsible Filter Panel */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-panel p-10 bg-white/5 rounded-[3rem] border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest ml-4">Rarity Tier</label>
                      <select 
                        value={selectedRarity}
                        onChange={(e) => setSelectedRarity(e.target.value as any)}
                        className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-4 px-6 text-xs uppercase tracking-widest font-black text-zinc-400 focus:border-amber-500/50 outline-none appearance-none cursor-pointer"
                      >
                        <option value="All">All Rarities</option>
                        {Object.keys(RARITY_COLORS).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest ml-4">Artifact Type</label>
                      <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as any)}
                        className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-4 px-6 text-xs uppercase tracking-widest font-black text-zinc-400 focus:border-amber-500/50 outline-none appearance-none cursor-pointer"
                      >
                        <option value="All">All Types</option>
                        <option value="Relic">Relic</option>
                        <option value="Ally">Ally</option>
                        <option value="Horror">Horror</option>
                        <option value="Spell">Spell</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest ml-4">Order Listings</label>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-4 px-6 text-xs uppercase tracking-widest font-black text-zinc-400 focus:border-amber-500/50 outline-none appearance-none cursor-pointer"
                      >
                        <option value="newest">Newest First</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="rarity">Rarity Intensity</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <button 
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedRarity("All");
                          setSelectedType("All");
                          setSortBy("newest");
                        }}
                        className="w-full glass-panel py-4 text-[10px] uppercase tracking-widest font-black text-zinc-600 hover:text-white transition-colors border-white/5 rounded-2xl"
                      >
                        Reset All Scrolls
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          {/* Market Status Alert if closed */}
          {!isMarketEnabled && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 rounded-[3rem] bg-red-500/5 border border-red-500/20 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl backdrop-blur-3xl"
            >
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                  <Lock className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif italic text-white leading-tight">The Bazaar is temporarily closed.</h3>
                  <p className="text-zinc-500 text-lg font-serif italic">The Keeper has barred the gates for essential maintenance. Trading is currently restricted.</p>
                </div>
              </div>
              <Link href="/dashboard" className="premium-button px-10 py-6 text-xs shrink-0">Return to Dashboard</Link>
            </motion.div>
          )}

          {/* Listing Grid */}
          <div className="space-y-12">
            {filteredListings.length === 0 ? (
              <div className="py-48 text-center space-y-12">
                <div className="relative w-48 h-48 mx-auto">
                  <div className="absolute inset-0 bg-amber-500/5 blur-[100px] rounded-full animate-pulse" />
                  <div className="relative w-full h-full bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-3xl overflow-hidden">
                    <Store className="w-20 h-20 text-zinc-800" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-50" />
                  </div>
                </div>
                <div className="space-y-6">
                  <p className="text-zinc-400 italic font-serif text-5xl">The Bazaar is quiet.</p>
                  <p className="text-zinc-600 text-lg max-w-lg mx-auto uppercase tracking-[0.3em] font-black leading-relaxed">No Pathwalkers have listed artifacts yet. Return after more treasures enter circulation.</p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
                    <Link href="/cards" className="premium-button px-12 py-6 text-xs">Visit the Vault</Link>
                    <Link href="/campaign" className="glass-panel px-12 py-6 text-xs text-zinc-500 hover:text-white uppercase tracking-widest font-black border-white/10">Walk the Yellow Path</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                {filteredListings.map((listing, index) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing} 
                    currentUserId={user.uid} 
                    index={index} 
                    onBuy={() => setSelectedListing(listing)}
                    disabled={!isMarketEnabled}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-20 border-t border-white/5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 bg-white/[0.02] p-12 rounded-[3rem] border border-white/5">
              <div className="space-y-6 max-w-2xl text-center lg:text-left">
                <h4 className="text-[11px] text-zinc-700 font-black uppercase tracking-[0.5em] flex items-center justify-center lg:justify-start gap-3">
                  <Shield className="w-4 h-4" /> Safety & Trust UI
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <TrustTip icon={<BadgeCheck />} text="Transactions are protected by server-side ownership checks." />
                  <TrustTip icon={<Clock />} text="Starter artifacts cannot be sold for 90 days after acquisition." />
                  <TrustTip icon={<Tag />} text="Marketplace fee: 7.5% per successful transaction." />
                  <TrustTip icon={<AlertTriangle />} text="Beta economy rules may change as the fog shifts." />
                </div>
              </div>
              <Link href="/library" className="group flex items-center gap-6 glass-panel px-10 py-10 hover:bg-white/5 transition-all rounded-[2.5rem] border-white/10">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <Scroll className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">Bazaar Regulations</p>
                  <p className="text-base text-zinc-400 italic font-serif">Read the merchant scrolls</p>
                </div>
                <ArrowRight className="w-6 h-6 text-zinc-800 group-hover:text-primary group-hover:translate-x-2 transition-all" />
              </Link>
            </div>
          </div>

          <BetaNotice />
        </div>

        {/* Modals */}
        <AnimatePresence>
          {isListingModalOpen && (
            <ListCardModal onClose={() => setIsListingModalOpen(false)} user={user} profile={profile} />
          )}
          {selectedListing && (
            <BuyConfirmationModal 
              listing={selectedListing} 
              user={user} 
              profile={profile} 
              onClose={() => setSelectedListing(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}

function StatCard({ label, value, icon, color, highlight = false, tooltip }: { label: string, value: string | number, icon: any, color: string, highlight?: boolean, tooltip?: string }) {
  return (
    <div className={cn(
      "glass-panel px-8 py-6 flex flex-col gap-4 border-white/5 bg-zinc-950/40 relative overflow-hidden group rounded-3xl",
      highlight && "bg-amber-500/5 border-amber-500/20"
    )}>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
         <div className="relative group/tooltip">
            <Info className="w-3 h-3 text-zinc-600" />
            <div className="absolute bottom-full right-0 mb-2 w-48 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all z-50">
               <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                  {tooltip}
               </div>
            </div>
         </div>
      </div>
      <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity", color)}>
        {icon}
      </div>
      <div className="flex items-center gap-4">
        <div className={cn("p-2 rounded-xl bg-black/40 border border-white/10", color)}>
          {React.cloneElement(icon, { className: "w-4 h-4" })}
        </div>
        <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest leading-none">{label}</span>
      </div>
      <p className={cn("text-3xl font-serif italic tracking-wide", color)}>{value}</p>
    </div>
  );
}

function TrustTip({ icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
        {React.cloneElement(icon, { className: "w-4 h-4 text-zinc-600" })}
      </div>
      <p className="text-[11px] text-zinc-500 italic font-serif leading-relaxed">{text}</p>
    </div>
  );
}

function ListingCard({ listing, currentUserId, index, onBuy, disabled }: { listing: any; currentUserId: string; index: number; onBuy: () => void; disabled?: boolean }) {
  const master = MASTER_CARDS.find(m => m.cardId === listing.cardId);
  const rarity = (master?.rarity as Rarity) || "Common";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 5) * 0.05, duration: 0.6 }}
      whileHover={{ y: -10 }}
      className="group relative cursor-pointer"
    >
      <div className={cn(
        "absolute -inset-4 rounded-[3.5rem] opacity-0 group-hover:opacity-100 blur-[40px] transition-all duration-700 z-0",
        RARITY_GLOWS[rarity]
      )} />
      
      <div className={cn(
        "relative flex flex-col h-full glass-panel overflow-hidden border backdrop-blur-3xl shadow-2xl bg-zinc-950/60 transition-all duration-500 rounded-[3rem] p-4",
        RARITY_BORDERS[rarity],
        "group-hover:border-primary/40"
      )}>
        <div className="relative aspect-[2/3] rounded-[2.2rem] overflow-hidden bg-black/40 mb-6">
          <img 
            src={master?.imageUrl || "/placeholder-card.png"} 
            alt={master?.name || "Unknown Artifact"}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-60 transition-opacity" />
          
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <div className={cn(
              "px-3 py-1.5 bg-black/80 backdrop-blur-2xl rounded-xl text-[8px] uppercase font-black tracking-[0.2em] border border-white/10",
              RARITY_COLORS[rarity]
            )}>
              {rarity}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 space-y-2 z-10">
            <p className="text-[7px] text-zinc-500 uppercase font-black tracking-widest leading-none">{master?.type || "Artifact"}</p>
            <h3 className="text-white font-serif text-2xl leading-tight italic group-hover:text-amber-500 transition-colors drop-shadow-lg line-clamp-1">
              {master?.name || "Unknown Artifact"}
            </h3>
          </div>
        </div>

        <div className="px-4 space-y-6 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                   <span className="text-[8px] text-zinc-600 font-black">{listing.sellerName?.charAt(0) || "?"}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[7px] text-zinc-600 uppercase font-black tracking-widest">Merchant</span>
                   <span className="text-[10px] text-zinc-400 font-serif italic truncate max-w-[80px]">{listing.sellerName || "Unknown Pathwalker"}</span>
                </div>
             </div>
             <div className="text-right">
                <span className="text-[7px] text-zinc-600 uppercase font-black tracking-widest">Edition</span>
                <p className="text-[10px] text-zinc-400 font-serif italic">#{listing.editionNumber || "???"}</p>
             </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-4 pb-2">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest leading-none mb-2">Asking Price</span>
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                <span className="text-3xl font-serif italic text-amber-500">{listing.price}</span>
              </div>
            </div>

            {listing.sellerId === currentUserId ? (
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-zinc-600" />
                <span className="text-[9px] uppercase font-black tracking-widest text-zinc-600 italic">Your Stall</span>
              </div>
            ) : (
              <button 
                onClick={onBuy}
                disabled={disabled}
                className="premium-button py-4 px-8 text-[10px] uppercase font-black tracking-[0.25em] active:scale-95 disabled:opacity-30 rounded-2xl"
              >
                Acquire
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ListCardModal({ onClose, user, profile }: { onClose: () => void; user: any; profile: any }) {
  const [activeTab, setActiveTab] = useState<"eligible" | "ineligible">("eligible");
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      const snap = await getDocs(collection(db, "users", user.uid, "playerCards"));
      const allCards = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      const processed = allCards.map(c => {
        const master = MASTER_CARDS.find(m => m.cardId === c.cardId);
        const isSaleLocked = c.saleUnlockDate && (c.saleUnlockDate.seconds * 1000 > Date.now());
        
        let reason = null;
        if (c.bound) reason = "Soulbound Artifact";
        else if (c.variant === "Starter Earned") reason = "Starter Launch Lock (90d)";
        else if (isSaleLocked) reason = `Market Restricted until ${new Date(c.saleUnlockDate.seconds * 1000).toLocaleDateString()}`;
        else if (c.activeInCampaign) reason = "Currently in Campaign Trial";
        else if (c.marketStatus === "listed") reason = "Already in the Bazaar";
        else if (c.pendingTrade) reason = "Pending Trade Ceremony";

        return { ...c, master, eligible: !reason, reason };
      });

      setCards(processed);
      setLoading(false);
    };
    fetchCards();
  }, [user.uid]);

  const eligibleCards = cards.filter(c => c.eligible);
  const ineligibleCards = cards.filter(c => !c.eligible);

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
        initial={{ scale: 0.95, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 50 }}
        className="w-full max-w-7xl glass-panel relative overflow-hidden flex flex-col md:flex-row h-full md:max-h-[85vh] bg-zinc-950 border-white/10 rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,1)]"
      >
        <button onClick={onClose} className="absolute top-8 right-8 z-50 p-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-zinc-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        {/* Card Selection Side */}
        <div className="w-full md:w-3/5 p-12 lg:p-20 border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_0%_0%,_#111_0%,_transparent_100%)]">
          <div className="space-y-16">
            <div className="space-y-6">
              <h2 className="text-6xl font-serif italic gold-gradient-text leading-none tracking-tighter">Market Listing</h2>
              <p className="text-zinc-500 text-xl font-serif italic leading-relaxed">Choose an eligible artifact from your collection to offer for trade in the grand Bazaar.</p>
            </div>

            <div className="space-y-10">
              <div className="flex gap-8 border-b border-white/5 pb-4">
                <button 
                  onClick={() => setActiveTab("eligible")}
                  className={cn(
                    "text-[10px] uppercase tracking-[0.4em] font-black pb-4 transition-all relative",
                    activeTab === "eligible" ? "text-amber-500" : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  Eligible ({eligibleCards.length})
                  {activeTab === "eligible" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-full" />}
                </button>
                <button 
                  onClick={() => setActiveTab("ineligible")}
                  className={cn(
                    "text-[10px] uppercase tracking-[0.4em] font-black pb-4 transition-all relative",
                    activeTab === "ineligible" ? "text-zinc-300" : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  Restricted ({ineligibleCards.length})
                  {activeTab === "ineligible" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-300 rounded-full" />}
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                  Array(6).fill(0).map((_, i) => <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-[2.5rem]" />)
                ) : (activeTab === "eligible" ? eligibleCards : ineligibleCards).length === 0 ? (
                  <div className="col-span-full py-32 glass-panel bg-white/5 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-16 rounded-[3rem]">
                    <Shield className="w-16 h-16 text-zinc-900 mb-8" />
                    <p className="text-zinc-500 italic font-serif text-2xl">No artifacts found in this category.</p>
                  </div>
                ) : (
                  (activeTab === "eligible" ? eligibleCards : ineligibleCards).map((card) => (
                    <motion.button 
                      key={card.id}
                      onClick={() => card.eligible && setSelectedCard(card)}
                      whileHover={card.eligible ? { y: -10 } : {}}
                      className={cn(
                        "relative aspect-[2/3] rounded-[2.5rem] overflow-hidden border-2 transition-all duration-700 group",
                        selectedCard?.id === card.id ? "border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.4)] scale-[1.05] z-10" : "border-white/5",
                        !card.eligible && "opacity-40 grayscale cursor-not-allowed"
                      )}
                    >
                      <img src={card.master?.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6 text-left space-y-2">
                        <p className={cn("text-[8px] uppercase font-black tracking-[0.3em]", RARITY_COLORS[card.master?.rarity as Rarity])}>{card.master?.rarity}</p>
                        <p className="text-sm text-white font-serif italic leading-tight line-clamp-1">{card.master?.name}</p>
                        {!card.eligible && <p className="text-[7px] text-red-500 uppercase font-black tracking-widest leading-tight mt-2">{card.reason}</p>}
                      </div>
                      {selectedCard?.id === card.id && (
                        <div className="absolute top-6 right-6 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-2xl border-2 border-black">
                          <Zap className="w-5 h-5 text-black fill-current" />
                        </div>
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Confirmation Side */}
        <div className="w-full md:w-2/5 p-12 lg:p-20 bg-[radial-gradient(circle_at_100%_100%,_rgba(184,134,11,0.1)_0%,_transparent_100%)] flex flex-col justify-between">
          <div className="space-y-16">
            <div className="space-y-8">
              <h3 className="text-3xl font-serif italic text-white flex items-center gap-6">
                <Tag className="w-8 h-8 text-amber-500" />
                Merchant Terms
              </h3>
              
              <div className="space-y-6">
                <label className="text-[11px] text-zinc-600 uppercase font-black tracking-[0.5em] ml-2">Set Offering Price</label>
                <div className="relative group">
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/10 transition-all">
                    <Coins className="w-8 h-8 text-amber-500" />
                  </div>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0000"
                    className="w-full bg-zinc-950/80 border-2 border-white/5 rounded-[2.5rem] py-10 pl-24 pr-10 text-5xl font-serif italic text-amber-500 focus:border-amber-500/50 outline-none transition-all placeholder:text-zinc-900 shadow-inner"
                  />
                </div>
              </div>

              <div className="glass-panel p-10 bg-white/[0.03] space-y-8 border-white/10 rounded-[3rem] shadow-2xl">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Bazaar Tax</span>
                    <p className="text-[9px] text-zinc-700 italic font-serif">Service fee for the Keeper</p>
                  </div>
                  <span className="text-sm font-mono text-red-500/60">7.5%</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white font-black uppercase tracking-widest">Merchant Yield</span>
                    <p className="text-[9px] text-zinc-500 italic font-serif">Net shards after trade</p>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <Coins className="w-6 h-6 text-amber-500 translate-y-1" />
                    <span className="text-5xl text-amber-500 font-serif italic drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">{price ? (parseInt(price) * 0.925).toFixed(0) : "0"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6 p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] backdrop-blur-3xl shadow-xl">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 mt-1">
                  <Info className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed italic font-serif">
                  You are listing this artifact in the Yellow Shards Bazaar. Ownership transfers immediately upon purchase. Listed items are held in escrow and cannot be used in campaigns.
                </p>
              </div>

              <button 
                onClick={handleList}
                disabled={!selectedCard || !price || isSubmitting}
                className="w-full premium-button group py-8 flex flex-col items-center justify-center gap-2 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
              >
                <div className="flex items-center gap-4">
                   <span className="text-sm uppercase tracking-[0.4em] font-black">{isSubmitting ? "Sealing Scroll..." : "List Artifact"}</span>
                   <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
                </div>
                <span className="text-[8px] uppercase tracking-[0.2em] opacity-40">Finalize Bazaar Offering</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function BuyConfirmationModal({ listing, user, profile, onClose }: { listing: any; user: any; profile: any; onClose: () => void }) {
  const [isBuying, setIsBuying] = useState(false);
  const master = MASTER_CARDS.find(m => m.cardId === listing.cardId);
  const rarity = (master?.rarity as Rarity) || "Common";
  const userBalance = profile?.yellowShards || 0;
  const canAfford = userBalance >= listing.price;
  const isHighValue = rarity === "Epic" || rarity === "Legendary" || rarity === "Founder";

  const handleBuy = async () => {
    if (isBuying || !canAfford) return;
    
    setIsBuying(true);
    try {
      const response = await fetch(`/api/marketplace/buy/${listing.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
      />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        className="w-full max-w-2xl glass-panel relative overflow-hidden bg-zinc-950 border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] p-12 lg:p-16 space-y-12"
      >
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 text-amber-500/60 bg-amber-500/5 px-5 py-2 rounded-full border border-amber-500/10 backdrop-blur-3xl w-fit mx-auto">
             <Coins className="w-3.5 h-3.5" />
             <span className="text-[10px] uppercase tracking-[0.5em] font-black">Trade Confirmation</span>
          </div>
          <h2 className="text-5xl font-serif italic text-white leading-tight">Acquire Artifact?</h2>
          <p className="text-zinc-500 text-lg font-serif italic">Confirm the transfer of Yellow Shards for this artifact.</p>
        </div>

        <div className="glass-panel p-8 bg-white/5 rounded-[2.5rem] border-white/5 flex items-center gap-8 relative group">
           <div className={cn("absolute inset-0 opacity-5 blur-3xl rounded-full", RARITY_COLORS[rarity])} />
           <div className={cn("relative w-32 aspect-[2/3] rounded-2xl overflow-hidden border-2 shadow-2xl shrink-0", RARITY_BORDERS[rarity])}>
              <img src={master?.imageUrl} className="w-full h-full object-cover" alt="" />
           </div>
           <div className="space-y-4">
              <div className="space-y-1">
                 <span className={cn("text-[9px] uppercase font-black tracking-widest", RARITY_COLORS[rarity])}>{rarity} Artifact</span>
                 <h3 className="text-3xl text-white font-serif italic leading-none">{master?.name}</h3>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                    <span className="text-[8px] text-zinc-600 font-black">{listing.sellerName?.charAt(0)}</span>
                 </div>
                 <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Seller: {listing.sellerName}</p>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="grid grid-cols-2 gap-8 px-4">
              <div className="space-y-2">
                 <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Your Balance</span>
                 <div className="flex items-center gap-3">
                    <Coins className="w-4 h-4 text-zinc-500" />
                    <span className="text-2xl font-serif italic text-zinc-400">{userBalance}</span>
                 </div>
              </div>
              <div className="space-y-2 text-right">
                 <span className="text-[10px] text-amber-500 uppercase font-black tracking-widest">Artifact Price</span>
                 <div className="flex items-center gap-3 justify-end">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <span className="text-4xl font-serif italic text-amber-500">{listing.price}</span>
                 </div>
              </div>
           </div>

           {isHighValue && (
              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-5">
                 <AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse" />
                 <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">High-value artifact. Confirm purchase carefully.</p>
              </div>
           )}

           <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <button 
                onClick={onClose}
                className="flex-1 glass-panel py-6 text-xs text-zinc-500 hover:text-white uppercase tracking-[0.3em] font-black border-white/10 rounded-[2rem]"
              >
                Back to Stalls
              </button>
              <button 
                onClick={handleBuy}
                disabled={isBuying || !canAfford}
                className="flex-[2] premium-button py-6 text-xs text-black uppercase tracking-[0.4em] font-black disabled:opacity-30 rounded-[2rem] shadow-2xl relative overflow-hidden group"
              >
                {isBuying ? "Acquiring..." : !canAfford ? "Insufficient Shards" : "Acquire Artifact"}
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function TrustCard({ icon, title, text }: { icon: any, title: string, text: string }) {
  return (
    <div className="glass-panel p-8 bg-white/5 border-white/10 rounded-[2.5rem] space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-amber-500">
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <h5 className="text-[10px] text-white font-black uppercase tracking-widest">{title}</h5>
      <p className="text-[11px] text-zinc-500 italic font-serif leading-relaxed">{text}</p>
    </div>
  );
}
