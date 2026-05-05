"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, query, where, getDocs, orderBy, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Share2, TrendingUp, DollarSign, Copy, 
  CheckCircle, AlertCircle, Info, ExternalLink,
  ChevronRight, ArrowUpRight, BadgePercent, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AffiliateStats {
  clicks: number;
  signups: number;
  conversions: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
}

export default function AffiliateDashboard() {
  const { user, profile } = useAuth();
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<AffiliateStats>({
    clicks: 0, signups: 0, conversions: 0, 
    pendingAmount: 0, approvedAmount: 0, paidAmount: 0
  });

  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://horrorofoz.com';

  useEffect(() => {
    if (user) {
      fetchAffiliateStatus();
    }
  }, [user]);

  async function fetchAffiliateStatus() {
    setLoading(true);
    try {
      const docRef = doc(db, "affiliates", user!.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAffiliateData(data);
        
        // Fetch Stats
        const referralsQuery = query(collection(db, "affiliateReferrals"), where("affiliateUserId", "==", user!.uid));
        const referralsSnap = await getDocs(referralsQuery);
        
        const commissionsQuery = query(collection(db, "affiliateCommissions"), where("affiliateUserId", "==", user!.uid));
        const commissionsSnap = await getDocs(commissionsQuery);
        
        let pending = 0, approved = 0, paid = 0;
        commissionsSnap.docs.forEach(d => {
           const c = d.data();
           if (c.status === 'pending') pending += c.commissionAmount;
           if (c.status === 'approved') approved += c.commissionAmount;
           if (c.status === 'paid') paid += c.commissionAmount;
        });

        setStats({
           clicks: data.totalClicks || 0,
           signups: referralsSnap.size,
           conversions: referralsSnap.docs.filter(d => d.data().convertedToPaid).length,
           pendingAmount: pending,
           approvedAmount: approved,
           paidAmount: paid
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const id = user!.uid;
      const refCode = profile?.username?.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
      
      const newAffiliate = {
        affiliateId: id,
        userId: id,
        username: profile?.username || "Pathwalker",
        status: 'pending',
        referralCode: refCode,
        referralLink: `${domain}/signup?ref=${refCode}`,
        totalClicks: 0,
        totalSignups: 0,
        paidConversions: 0,
        pendingCommission: 0,
        approvedCommission: 0,
        paidCommission: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "affiliates", id), newAffiliate);
      setAffiliateData(newAffiliate);
      setMessage("Your application is now under review by the Archivists.");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const copyLink = () => {
    if (affiliateData?.referralLink) {
      navigator.clipboard.writeText(affiliateData.referralLink);
      setMessage("Referral link copied to clipboard.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-serif italic text-primary">Consulting the Records...</div>;

  return (
    <MainLayout>
      <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-12 pb-24">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary text-xs uppercase font-black tracking-[0.3em]">
              <Share2 className="w-4 h-4" /> Pathwalker Affiliate Program
            </div>
            <h1 className="text-5xl font-serif italic text-white leading-tight">Affiliate Dashboard</h1>
            <p className="text-zinc-500 font-serif italic text-lg">Expand the reach of the Yellow Path and earn rewards.</p>
          </div>
          {affiliateData?.status === 'approved' && (
            <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" /> Official Path Affiliate
            </div>
          )}
        </header>

        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-3 rounded-lg backdrop-blur-md">
            <CheckCircle className="w-5 h-5" /> {message}
          </motion.div>
        )}

        {!affiliateData ? (
          <div className="glass-panel p-16 text-center space-y-8 rounded-[3rem] border-white/5 bg-zinc-950/40">
             <div className="max-w-2xl mx-auto space-y-6">
                <Users className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                <h2 className="text-3xl font-serif italic text-white">Join the High Archivist's Network</h2>
                <p className="text-zinc-500 font-serif italic leading-relaxed">
                   Share the Horror of Oz with your community and earn 20% commission on every new paid membership. Help us grow the chronicles and reward those who dare to walk the path.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
                   <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary font-bold">1</div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Apply</p>
                   </div>
                   <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary font-bold">2</div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Invite</p>
                   </div>
                   <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary font-bold">3</div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Earn</p>
                   </div>
                </div>
                <button 
                  onClick={handleApply}
                  disabled={isApplying}
                  className="premium-button premium-button-gold px-12 py-5 text-xl rounded-[2.5rem]"
                >
                  {isApplying ? "Submitting Application..." : "Apply to Program"}
                </button>
             </div>
          </div>
        ) : affiliateData.status === 'pending' ? (
          <div className="glass-panel p-16 text-center space-y-6 rounded-[3rem] border-white/5 bg-zinc-950/20">
             <Info className="w-12 h-12 text-amber-500/40 mx-auto" />
             <h2 className="text-3xl font-serif italic text-zinc-400">Application Under Review</h2>
             <p className="text-zinc-600 font-serif italic max-w-lg mx-auto">
                The High Archivists are verifying your credentials. You will be notified once your referral link is activated.
             </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { label: "Total Clicks", val: stats.clicks, icon: TrendingUp, color: "zinc" },
                { label: "Signups", val: stats.signups, icon: Users, color: "zinc" },
                { label: "Conversions", val: stats.conversions, icon: CheckCircle, color: "emerald" },
                { label: "Pending", val: `$${stats.pendingAmount}`, icon: Info, color: "amber" },
                { label: "Approved", val: `$${stats.approvedAmount}`, icon: DollarSign, color: "emerald" },
                { label: "Total Paid", val: `$${stats.paidAmount}`, icon: ShieldCheck, color: "primary" }
              ].map((s, i) => (
                <div key={i} className="glass-panel p-6 rounded-3xl border-white/5 space-y-3">
                   <div className="flex items-center justify-between text-zinc-600">
                      <s.icon className="w-4 h-4" />
                      <span className="text-[7px] uppercase font-black tracking-widest">{s.label}</span>
                   </div>
                   <p className={cn("text-2xl font-serif italic", s.color === "emerald" ? "text-emerald-500" : s.color === "primary" ? "text-primary" : s.color === "amber" ? "text-amber-500" : "text-white")}>
                      {s.val}
                   </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Controls */}
              <div className="lg:col-span-2 space-y-12">
                <section className="space-y-6">
                   <h2 className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-500">Your Referral Identity</h2>
                   <div className="glass-panel p-8 rounded-[2.5rem] border-primary/20 bg-primary/[0.02] space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                      
                      <div className="space-y-2 relative z-10">
                         <p className="text-[9px] uppercase font-black tracking-widest text-primary/60">Official Referral Link</p>
                         <div className="flex gap-4">
                            <div className="flex-1 bg-black/60 border border-white/5 p-4 rounded-xl text-sm font-serif italic text-zinc-400 overflow-hidden truncate">
                               {affiliateData.referralLink}
                            </div>
                            <button 
                              onClick={copyLink}
                              className="px-6 py-4 rounded-xl bg-primary text-black font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" /> Copy
                            </button>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 pt-4 relative z-10">
                         <div className="space-y-1">
                            <p className="text-[8px] uppercase font-black tracking-widest text-zinc-600">Referral Code</p>
                            <p className="text-xl text-white font-serif italic tracking-tighter">{affiliateData.referralCode}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] uppercase font-black tracking-widest text-zinc-600">Commission Rate</p>
                            <p className="text-xl text-primary font-serif italic tracking-tighter">20% Beta Standard</p>
                         </div>
                      </div>
                   </div>
                </section>

                <section className="space-y-6">
                   <h2 className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-500">Recent Conversions</h2>
                   <div className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden">
                      <table className="w-full text-left">
                         <thead className="bg-white/5 text-[9px] uppercase font-black tracking-widest text-zinc-600">
                            <tr>
                               <th className="p-6">Initiate</th>
                               <th className="p-6">Status</th>
                               <th className="p-6 text-right">Commission</th>
                            </tr>
                         </thead>
                         <tbody className="text-xs font-serif italic text-zinc-400">
                            <tr className="border-t border-white/5">
                               <td className="p-6">No conversions recorded yet.</td>
                               <td className="p-6">---</td>
                               <td className="p-6 text-right">---</td>
                            </tr>
                         </tbody>
                      </table>
                   </div>
                </section>
              </div>

              {/* Rules & Info */}
              <div className="lg:col-span-1 space-y-8">
                 <section className="space-y-6">
                    <h2 className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-500">Program Protocol</h2>
                    <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-zinc-950/40 space-y-6">
                       <div className="space-y-4">
                          {[
                            "Earn 20% on the first paid membership cycle.",
                            "Commissions start as Pending for 30 days.",
                            "Minimum payout threshold: $50.00.",
                            "Self-referrals are strictly forbidden.",
                            "Payouts processed monthly via the Keeper."
                          ].map((rule, i) => (
                            <div key={i} className="flex gap-4 items-start">
                               <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                               <p className="text-xs text-zinc-500 leading-relaxed font-serif italic">{rule}</p>
                            </div>
                          ))}
                       </div>
                       
                       <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                          <div className="flex items-center gap-2 text-amber-500 text-[8px] uppercase font-black tracking-widest">
                             <AlertCircle className="w-3 h-3" /> Beta Notice
                          </div>
                          <p className="text-[10px] text-amber-500/70 font-serif italic leading-relaxed">
                             This program is currently in Public Beta. Commission rates and rules are subject to archival adjustments.
                          </p>
                       </div>
                    </div>
                 </section>

                 <section className="space-y-6">
                    <h2 className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-500">Creative Assets</h2>
                    <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-zinc-950/40 space-y-4">
                       <p className="text-xs text-zinc-400 font-serif italic">Need banners or character art for your promotion?</p>
                       <Link href="/press" className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-primary/50 transition-all">
                          <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500 group-hover:text-primary transition-colors">Archivist Press Kit</span>
                          <ArrowUpRight className="w-4 h-4 text-zinc-800 group-hover:text-primary transition-colors" />
                       </Link>
                    </div>
                 </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
