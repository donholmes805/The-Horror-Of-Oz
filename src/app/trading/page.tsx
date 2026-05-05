"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeftRight, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus,
  User,
  ChevronRight,
  ShieldAlert,
  Scroll,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BetaNotice } from "@/components/shared/BetaNotice";

export default function TradingHub() {
  const { user, profile } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing" | "history">("incoming");

  useEffect(() => {
    if (!user) return;

    // Safety timeout to clear loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const tradesRef = collection(db, "trades");
    let q;

    if (activeTab === "incoming") {
      q = query(tradesRef, where("receiverId", "==", user.uid), where("status", "==", "pending"), orderBy("createdAt", "desc"));
    } else if (activeTab === "outgoing") {
      q = query(tradesRef, where("senderId", "==", user.uid), where("status", "==", "pending"), orderBy("createdAt", "desc"));
    } else {
      q = query(tradesRef, where("participants", "array-contains", user.uid), where("status", "in", ["accepted", "rejected", "canceled"]), orderBy("createdAt", "desc"));
    }

    const unsub = onSnapshot(q, 
      (snap) => {
        setTrades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
        clearTimeout(timeout);
      },
      (error) => {
        console.error("Trading sync error:", error);
        // If query fails (likely due to missing index), fallback to simpler query
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
          console.warn("Retrying with simple query (missing index?)...");
          let simpleQ;
          if (activeTab === "incoming") {
            simpleQ = query(tradesRef, where("receiverId", "==", user.uid), where("status", "==", "pending"));
          } else if (activeTab === "outgoing") {
            simpleQ = query(tradesRef, where("senderId", "==", user.uid), where("status", "==", "pending"));
          } else {
            simpleQ = query(tradesRef, where("participants", "array-contains", user.uid), where("status", "in", ["accepted", "rejected", "canceled"]));
          }
          onSnapshot(simpleQ, (s) => {
            setTrades(s.docs.map(d => ({ id: d.id, ...d.data() })));
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
  }, [user, activeTab]);

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="glass-panel p-12 text-center max-w-md rounded-3xl border-white/5 bg-zinc-950/40">
            <ShieldAlert className="w-16 h-16 text-amber-500/20 mx-auto mb-6" />
            <h2 className="text-3xl font-serif italic text-white mb-4">The Ledgers are Locked</h2>
            <p className="text-zinc-500 mb-8 italic">Only verified Pathwalkers may engage in direct artifact exchange. Please sign in to access the hub.</p>
            <Link href="/login" className="premium-button block w-full text-center">Sign In</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading && trades.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="font-serif italic text-amber-500/60 animate-pulse text-xl">Consulting the trade ledgers...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        <div className="p-8 max-w-6xl mx-auto space-y-16">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-amber-500/60 bg-amber-500/5 px-4 py-1.5 rounded-full border border-amber-500/10 backdrop-blur-xl w-fit">
                <Scroll className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-black">Trade Records</span>
              </div>
              <div className="space-y-2">
                <h1 className="font-serif text-6xl md:text-8xl gold-gradient-text italic tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                  Trading Hub
                </h1>
                <p className="text-zinc-500 text-lg font-serif italic max-w-xl">
                  Forge alliances and exchange artifacts directly with other travelers of the Yellow Path.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Link 
                href="/trading/new" 
                className="premium-button px-12 py-6 flex items-center gap-4 group shadow-2xl"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[12px] uppercase tracking-[0.3em] font-black">Propose New Trade</span>
              </Link>
            </motion.div>
          </header>

          {/* Tabs */}
          <div className="flex gap-12 border-b border-white/5 relative">
            {(["incoming", "outgoing", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setLoading(true);
                  setActiveTab(tab);
                }}
                className={cn(
                  "pb-6 text-[11px] uppercase tracking-[0.4em] font-black transition-all relative z-10",
                  activeTab === tab ? "text-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "text-zinc-500 hover:text-white"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabUnderline" 
                    className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" 
                  />
                )}
              </button>
            ))}
          </div>

          {/* Trade List */}
          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="py-32 text-center space-y-6">
                <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                <p className="font-serif italic text-amber-500/60 animate-pulse text-xl">Consulting the trade ledgers...</p>
              </div>
            ) : trades.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 text-center space-y-8 glass-panel bg-white/[0.02] border-dashed border-white/10 rounded-[3rem]"
              >
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 opacity-40">
                  <Clock className="w-10 h-10 text-zinc-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-zinc-400 italic font-serif text-2xl">No trades found in the archives.</p>
                  <p className="text-zinc-600 text-sm uppercase tracking-widest font-black">Propose an offer to begin your exchange.</p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {trades.map((trade, idx) => (
                  <TradeCard key={trade.id} trade={trade} currentUserId={user.uid} index={idx} />
                ))}
              </div>
            )}
          </div>
          <BetaNotice />
        </div>
      </div>
    </MainLayout>
  );
}

function TradeCard({ trade, currentUserId, index }: { trade: any; currentUserId: string; index: number }) {
  const isSender = trade.senderId === currentUserId;
  const otherUser = isSender ? trade.receiverName : trade.senderName;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-panel p-8 flex flex-col lg:flex-row justify-between items-center gap-10 group hover:border-amber-500/30 transition-all duration-500 bg-zinc-950/40 rounded-[2.5rem]"
    >
      {/* User Info */}
      <div className="flex items-center gap-8 min-w-[240px]">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-amber-500/40 transition-colors">
            <User className="text-zinc-500 group-hover:text-amber-500 transition-colors w-8 h-8" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Direct Trade</p>
          <h3 className="text-2xl text-white font-serif italic group-hover:gold-gradient-text transition-all duration-300">{otherUser}</h3>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-amber-500/40" />
            <p className="text-[10px] text-amber-500/60 uppercase tracking-[0.2em] font-black">
              {new Date(trade.createdAt?.seconds * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Trade Assets */}
      <div className="flex-1 flex items-center justify-center gap-12 px-12 lg:border-x border-white/5 py-4 w-full md:w-auto">
        <div className="text-center space-y-4">
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Giving</p>
          <div className="flex -space-x-3 justify-center">
            {trade.senderOffer.map((cardId: string, i: number) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -4, zIndex: 10 }}
                className="w-12 h-16 rounded-lg border-2 border-amber-500/20 bg-zinc-950 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group/card"
              >
                <div className="absolute inset-0 bg-amber-500/5 group-hover/card:bg-amber-500/10 transition-colors" />
                <span className="text-[10px] text-amber-500 font-black relative z-10">{cardId.slice(0, 2).toUpperCase()}</span>
                <div className="w-full h-1 bg-amber-500/20 absolute bottom-0" />
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02] shadow-inner">
          <ArrowLeftRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors" />
        </div>

        <div className="text-center space-y-4">
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Requesting</p>
          <div className="flex -space-x-3 justify-center">
            {trade.receiverOffer.map((cardId: string, i: number) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -4, zIndex: 10 }}
                className="w-12 h-16 rounded-lg border-2 border-red-500/20 bg-zinc-950 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group/card"
              >
                <div className="absolute inset-0 bg-red-500/5 group-hover/card:bg-red-500/10 transition-colors" />
                <span className="text-[10px] text-red-500 font-black relative z-10">{cardId.slice(0, 2).toUpperCase()}</span>
                <div className="w-full h-1 bg-red-500/20 absolute bottom-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-6 min-w-[200px] justify-end w-full md:w-auto">
        <div className="text-right flex flex-col items-end">
          <span className={cn(
            "text-[9px] uppercase font-black tracking-[0.3em] px-4 py-1.5 rounded-full border mb-4 inline-block",
            trade.status === "pending" ? "border-amber-500/30 text-amber-500 bg-amber-500/5" :
            trade.status === "accepted" ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" :
            "border-red-500/30 text-red-500 bg-red-500/5"
          )}>
            {trade.status}
          </span>
          <Link 
            href={`/trading/${trade.id}`}
            className="flex items-center gap-2 text-[11px] uppercase font-black tracking-[0.2em] text-zinc-400 hover:text-white transition-colors group/link"
          >
            Review Offer <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
