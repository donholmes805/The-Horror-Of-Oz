"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { MASTER_CARDS } from "@/constants/cards";
import { motion } from "framer-motion";
import { 
  ArrowLeftRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert,
  ChevronLeft,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function TradeDetailPage() {
  const { user, profile } = useAuth();
  const { tradeId } = useParams();
  const router = useRouter();
  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!tradeId) return;
    const unsub = onSnapshot(doc(db, "trades", tradeId as string), (snap) => {
      if (snap.exists()) {
        setTrade({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [tradeId]);

  const handleAction = async (action: "accept" | "reject" | "cancel") => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/trading/${tradeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user?.uid }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      if (action === "accept") alert("Pact Sealed. Cards have been exchanged.");
      router.push("/trading");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <MainLayout><div className="py-20 text-center font-serif italic text-primary animate-pulse">Reading the trade parchment...</div></MainLayout>;
  if (!trade) return <MainLayout><div className="py-20 text-center text-muted-foreground">Trade not found.</div></MainLayout>;

  const isSender = trade.senderId === user?.uid;
  const isReceiver = trade.receiverId === user?.uid;

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/trading" className="text-muted-foreground hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-primary text-[10px] uppercase font-bold tracking-[0.3em]">
              Exchange ID: {trade.id.slice(0, 8)}
            </div>
            <h1 className="text-3xl font-serif italic text-white">The Terms of the Pact</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
            <div className="w-12 h-12 rounded-full bg-black border border-primary/40 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Sender Side */}
          <div className={cn("gothic-panel p-8 space-y-6", isSender ? "border-primary/20" : "opacity-60")}>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Offered by</p>
              <h3 className="text-2xl text-white font-serif italic">{trade.senderName}</h3>
            </div>
            <div className="space-y-3">
              {trade.senderOffer.map((cardDocId: string, i: number) => (
                <TradeCardItem key={i} cardDocId={cardDocId} userId={trade.senderId} />
              ))}
              {trade.senderOffer.length === 0 && <p className="text-center text-muted-foreground italic text-xs">Nothing offered</p>}
            </div>
          </div>

          {/* Receiver Side */}
          <div className={cn("gothic-panel p-8 space-y-6", isReceiver ? "border-primary/20" : "opacity-60")}>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Requested from</p>
              <h3 className="text-2xl text-white font-serif italic">{trade.receiverName}</h3>
            </div>
            <div className="space-y-3">
              {trade.receiverOffer.map((cardDocId: string, i: number) => (
                <TradeCardItem key={i} cardDocId={cardDocId} userId={trade.receiverId} />
              ))}
              {trade.receiverOffer.length === 0 && <p className="text-center text-muted-foreground italic text-xs">Nothing requested</p>}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="gothic-panel p-8 flex flex-col items-center gap-6 border-t-2 border-primary/20 bg-primary/5">
          <div className="text-center space-y-2">
            <span className={cn(
              "px-4 py-1 rounded text-[10px] uppercase font-bold tracking-widest",
              trade.status === "pending" ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/20" :
              trade.status === "accepted" ? "bg-primary/20 text-primary border border-primary/20" :
              "bg-secondary/20 text-secondary border border-secondary/20"
            )}>
              Status: {trade.status}
            </span>
            <p className="text-muted-foreground italic text-sm">
              {trade.status === "pending" ? "Awaiting a response from the Pathwalker." : 
               trade.status === "accepted" ? "This exchange has been completed." : "This offer was rejected or canceled."}
            </p>
          </div>

          <div className="flex gap-4">
            {trade.status === "pending" && isReceiver && (
              <>
                <button 
                  onClick={() => handleAction("reject")}
                  disabled={isProcessing}
                  className="px-10 py-3 border border-secondary/40 text-secondary hover:bg-secondary/10 uppercase text-xs font-bold tracking-widest transition-all"
                >
                  Reject Offer
                </button>
                <button 
                  onClick={() => handleAction("accept")}
                  disabled={isProcessing}
                  className="brass-button px-12 py-3"
                >
                  {isProcessing ? "Sealing..." : "Accept Exchange"}
                </button>
              </>
            )}
            {trade.status === "pending" && isSender && (
              <button 
                onClick={() => handleAction("cancel")}
                disabled={isProcessing}
                className="px-10 py-3 border border-white/10 text-muted-foreground hover:text-white uppercase text-xs font-bold tracking-widest transition-all"
              >
                Cancel Request
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function TradeCardItem({ cardDocId, userId }: { cardDocId: string; userId: string }) {
  // We don't have the card data here, we'd normally fetch it or pass it in trade metadata
  // For simplicity, we'll just show the doc ID or try to resolve from MASTER_CARDS if trade doc has cardId
  // (In a real app, I'd store the cardId (master) in the trade doc for easier rendering)
  // Let's assume for this demo we just show a generic card slot or I'd need to fetch
  return (
    <div className="flex items-center gap-4 p-3 bg-black/40 rounded border border-white/5">
      <div className="w-10 h-14 bg-primary/20 rounded border border-primary/40 flex items-center justify-center">
        <ShieldAlert className="w-4 h-4 text-primary opacity-40" />
      </div>
      <div>
        <p className="text-white text-xs font-serif italic">Relic Slot</p>
        <p className="text-[8px] text-muted-foreground uppercase tracking-widest">{cardDocId.slice(0, 10)}...</p>
      </div>
    </div>
  );
}
