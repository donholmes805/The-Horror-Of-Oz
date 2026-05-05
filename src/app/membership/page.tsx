"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ShieldCheck, Zap, BookOpen, Volume2, ArrowLeftRight, Store, Star } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BetaNotice } from "@/components/shared/BetaNotice";

export default function MembershipPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to initiate checkout", error);
    } finally {
      setLoading(false);
    }
  };

  const isPaid = profile?.membershipStatus === "paid" || profile?.membershipStatus === "admin" || profile?.membershipStatus === "owner";

  return (
    <MainLayout>
      <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shadow-[0_0_30px_rgba(184,134,11,0.2)]">
              <Star className="text-primary w-10 h-10 animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl font-serif italic text-white tracking-tight">Become a Member of the Order</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Unlock the full chronicles, early access to cards, and the complete audiobook experience.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Current Status / Free Plan */}
          <div className="gothic-panel p-8 space-y-6 opacity-60 grayscale border-white/5">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-serif italic text-white">Free Pathwalker</h2>
              <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded">Current</span>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="w-5 h-5 shrink-0" /> Campaign Access (Standard)
              </li>
              <li className="flex gap-3 text-sm text-muted-foreground">
                <BookOpen className="w-5 h-5 shrink-0" /> Library Previews
              </li>
              <li className="flex gap-3 text-sm text-muted-foreground">
                <Store className="w-5 h-5 shrink-0" /> Marketplace Browsing
              </li>
            </ul>
            <div className="pt-6 border-t border-white/5">
              <p className="text-2xl font-serif italic text-white">$0 <span className="text-sm text-muted-foreground font-sans uppercase tracking-widest">/ month</span></p>
            </div>
          </div>

          {/* Paid Member Plan */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="gothic-panel p-8 space-y-6 border-primary/40 relative overflow-hidden shadow-[0_0_50px_rgba(184,134,11,0.1)]"
          >
            <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-bold uppercase tracking-widest px-4 py-1 -rotate-0">
              Recommended
            </div>
            
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-serif italic text-primary">Paid Member</h2>
            </div>
            
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-foreground">
                <Zap className="w-5 h-5 text-primary shrink-0" /> Priority Campaign Movement
              </li>
              <li className="flex gap-3 text-sm text-foreground">
                <BookOpen className="w-5 h-5 text-primary shrink-0" /> Unlimited Full Book Access
              </li>
              <li className="flex gap-3 text-sm text-foreground">
                <Volume2 className="w-5 h-5 text-primary shrink-0" /> Full Audiobook Library
              </li>
              <li className="flex gap-3 text-sm text-foreground">
                <ArrowLeftRight className="w-5 h-5 text-primary shrink-0" /> P2P Trading (Immediate)
              </li>
              <li className="flex gap-3 text-sm text-foreground">
                <Star className="w-5 h-5 text-primary shrink-0" /> Early Founder Card Drops
              </li>
            </ul>

            <div className="pt-6 border-t border-primary/10">
              <p className="text-4xl font-serif italic text-primary">$9.99 <span className="text-sm text-muted-foreground font-sans uppercase tracking-widest">/ month</span></p>
            </div>

            <button 
              onClick={handleUpgrade}
              disabled={loading || isPaid}
              className={cn(
                "w-full py-4 uppercase tracking-[0.2em] font-bold text-sm transition-all shadow-[0_0_20px_rgba(184,134,11,0.3)]",
                isPaid ? "bg-green-500/20 text-green-500 border border-green-500/40 cursor-default" : "brass-button"
              )}
            >
              {loading ? "Preparing the Ritual..." : isPaid ? "Active Membership" : "Ascend to the Order"}
            </button>
          </motion.div>
        </div>

        <section className="text-center pt-12">
          <p className="text-muted-foreground text-sm italic">"The path is long, but the rewards are eternal."</p>
        </section>
        <BetaNotice />
      </div>
    </MainLayout>
  );
}
