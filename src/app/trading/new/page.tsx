"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { MASTER_CARDS, MasterCard } from "@/constants/cards";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  User, 
  ArrowLeftRight, 
  ShieldAlert, 
  ChevronRight,
  Lock,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NewTradePage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [myCards, setMyCards] = useState<any[]>([]);
  const [theirCards, setTheirCards] = useState<any[]>([]);
  
  const [selectedMyCards, setSelectedMyCards] = useState<string[]>([]);
  const [selectedTheirCards, setSelectedTheirCards] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Search users
  const handleSearch = async () => {
    if (searchQuery.length < 3) return;
    const q = query(collection(db, "users"), where("username", "==", searchQuery));
    const snap = await getDocs(q);
    setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user?.uid));
  };

  // Fetch cards
  useEffect(() => {
    if (!user) return;
    const fetchMyCards = async () => {
      const snap = await getDocs(collection(db, "users", user.uid, "playerCards"));
      setMyCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchMyCards();
  }, [user]);

  useEffect(() => {
    if (!targetUser) return;
    const fetchTheirCards = async () => {
      const snap = await getDocs(collection(db, "users", targetUser.id, "playerCards"));
      setTheirCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchTheirCards();
  }, [targetUser]);

  const handleSubmit = async () => {
    if (!user || !targetUser || isSubmitting) return;
    if (selectedMyCards.length === 0 && selectedTheirCards.length === 0) {
      setError("Cannot send an empty trade offer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.uid,
          senderName: profile?.username,
          receiverId: targetUser.id,
          receiverName: targetUser.username,
          senderOffer: selectedMyCards,
          receiverOffer: selectedTheirCards,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create trade");
      }

      router.push("/trading");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCardEligible = (card: any) => {
    if (card.bound) return false;
    if (card.activeInCampaign) return false;
    if (card.marketStatus === "listed") return false;
    
    // Trade lock check
    if (card.tradeUnlockDate) {
      const unlock = new Date(card.tradeUnlockDate.seconds * 1000);
      if (unlock > new Date()) return false;
    }
    
    return true;
  };

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-primary text-xs uppercase font-bold tracking-[0.3em]">
            <ArrowLeftRight className="w-4 h-4" /> Initiating Exchange
          </div>
          <h1 className="text-4xl font-serif italic text-white">Draft a Trade Offer</h1>
        </header>

        {!targetUser ? (
          <div className="max-w-xl mx-auto space-y-8 py-12">
            <div className="gothic-panel p-8 space-y-6">
              <h2 className="text-2xl font-serif italic text-white text-center">Locate a Pathwalker</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full bg-black border border-white/10 rounded-lg pl-12 pr-4 py-4 text-white focus:border-primary outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button 
                onClick={handleSearch}
                className="w-full brass-button py-4"
              >
                Search the Archives
              </button>
            </div>

            <div className="space-y-4">
              {searchResults.map((u) => (
                <button 
                  key={u.id}
                  onClick={() => setTargetUser(u)}
                  className="w-full gothic-panel p-6 flex items-center justify-between group hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="text-primary w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-serif italic text-lg">{u.username}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Level {u.level || 1} • Pathwalker</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* My Cards */}
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-primary/20 pb-4">
                <h2 className="text-2xl font-serif italic text-primary">Your Offer</h2>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{selectedMyCards.length} Selected</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                {myCards.map((card) => {
                  const eligible = isCardEligible(card);
                  const selected = selectedMyCards.includes(card.id);
                  const master = MASTER_CARDS.find(m => m.cardId === card.cardId);

                  return (
                    <div 
                      key={card.id}
                      onClick={() => eligible && (selected ? setSelectedMyCards(selectedMyCards.filter(id => id !== card.id)) : setSelectedMyCards([...selectedMyCards, card.id]))}
                      className={cn(
                        "relative aspect-[2/3] gothic-panel p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                        !eligible ? "opacity-40 grayscale cursor-not-allowed border-white/5" : 
                        selected ? "border-primary shadow-[0_0_15px_rgba(184,134,11,0.2)] bg-primary/5" : "hover:border-primary/40"
                      )}
                    >
                      {!eligible && <Lock className="absolute top-2 right-2 w-3 h-3 text-secondary" />}
                      {selected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />}
                      <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">{master?.rarity}</p>
                      <p className="text-[10px] text-white font-serif italic leading-tight">{master?.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Their Cards */}
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-secondary/20 pb-4">
                <h2 className="text-2xl font-serif italic text-secondary">Requesting from {targetUser.username}</h2>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{selectedTheirCards.length} Selected</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                {theirCards.map((card) => {
                  const eligible = isCardEligible(card);
                  const selected = selectedTheirCards.includes(card.id);
                  const master = MASTER_CARDS.find(m => m.cardId === card.cardId);

                  return (
                    <div 
                      key={card.id}
                      onClick={() => eligible && (selected ? setSelectedTheirCards(selectedTheirCards.filter(id => id !== card.id)) : setSelectedTheirCards([...selectedTheirCards, card.id]))}
                      className={cn(
                        "relative aspect-[2/3] gothic-panel p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                        !eligible ? "opacity-40 grayscale cursor-not-allowed border-white/5" : 
                        selected ? "border-secondary shadow-[0_0_15px_rgba(204,0,0,0.2)] bg-secondary/5" : "hover:border-secondary/40"
                      )}
                    >
                      {!eligible && <Lock className="absolute top-2 right-2 w-3 h-3 text-secondary" />}
                      {selected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-secondary" />}
                      <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">{master?.rarity}</p>
                      <p className="text-[10px] text-white font-serif italic leading-tight">{master?.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {targetUser && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="fixed bottom-0 left-0 right-0 p-8 bg-black/80 backdrop-blur-xl border-t border-primary/20 z-50"
            >
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Your Offer</p>
                    <p className="text-xl text-primary font-serif italic">{selectedMyCards.length} Cards</p>
                  </div>
                  <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Requested</p>
                    <p className="text-xl text-secondary font-serif italic">{selectedTheirCards.length} Cards</p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-widest">
                    <AlertTriangle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => { setTargetUser(null); setSelectedMyCards([]); setSelectedTheirCards([]); }}
                    className="px-8 py-3 border border-white/10 text-muted-foreground hover:text-white text-xs uppercase font-bold tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="brass-button px-12 py-3"
                  >
                    {isSubmitting ? "Sealing the Pact..." : "Send Trade Offer"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
