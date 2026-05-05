"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy, serverTimestamp, where } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Shield, CheckCircle, XCircle, Search, 
  Filter, DollarSign, Clock, AlertTriangle, 
  ArrowRight, Mail, User, Info, MoreVertical,
  Check, X, Zap, RefreshCcw, TrendingUp,
  Wallet, ShieldAlert, BadgeCheck, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Affiliate {
  affiliateId: string;
  userId: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  referralCode: string;
  totalClicks: number;
  totalSignups: number;
  paidConversions: number;
  pendingCommission: number;
  approvedCommission: number;
  paidCommission: number;
  createdAt: any;
}

interface Commission {
  commissionId: string;
  affiliateUserId: string;
  referredUserId: string;
  grossAmount: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: any;
}

export default function AdminAffiliates() {
  const { isOwner } = useAuth();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'partners' | 'commissions' | 'payouts'>('partners');
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOwner) {
      fetchAffiliateData();
    }
  }, [isOwner]);

  async function fetchAffiliateData() {
    setLoading(true);
    try {
      const affSnap = await getDocs(query(collection(db, "affiliates"), orderBy("createdAt", "desc")));
      setAffiliates(affSnap.docs.map(d => ({ ...d.data(), affiliateId: d.id } as Affiliate)));
      
      const commSnap = await getDocs(query(collection(db, "affiliateCommissions"), orderBy("createdAt", "desc")));
      setCommissions(commSnap.docs.map(d => ({ ...d.data(), commissionId: d.id } as Commission)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const updateAffiliateStatus = async (id: string, status: Affiliate['status']) => {
    try {
      await updateDoc(doc(db, "affiliates", id), { status, updatedAt: serverTimestamp() });
      setMessage(`Affiliate ${status} successfully.`);
      fetchAffiliateData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const updateCommissionStatus = async (id: string, status: Commission['status']) => {
    try {
      await updateDoc(doc(db, "affiliateCommissions", id), { 
        status, 
        approvedAt: status === 'approved' ? serverTimestamp() : null,
        paidAt: status === 'paid' ? serverTimestamp() : null,
      });
      setMessage(`Commission ${status} successfully.`);
      fetchAffiliateData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  if (!isOwner) return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="glass-panel p-12 text-center space-y-6 rounded-[3rem] border-white/5">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-3xl font-serif italic text-white">Forbidden Network</h1>
          <p className="text-zinc-500 font-serif italic">Only the Keeper of the Path may manage the network.</p>
          <Link href="/dashboard" className="premium-button px-8 py-3 text-[10px] inline-block">Return to Safety</Link>
        </div>
      </div>
    </MainLayout>
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Sparkles className="w-16 h-16 text-primary animate-spin" /></div>;

  const totalEarnings = commissions
    .filter(c => c.status === 'paid')
    .reduce((acc, c) => acc + c.commissionAmount, 0);

  const pendingPayouts = commissions
    .filter(c => c.status === 'approved')
    .reduce((acc, c) => acc + c.commissionAmount, 0);

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1105_0%,_#000_100%)] pb-24">
        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12 pt-24 md:pt-32">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary text-[10px] uppercase font-black tracking-[0.5em] mb-2 opacity-70">
                 <Shield className="w-4 h-4" /> Administrative Oversight
              </div>
              <h1 className="text-6xl md:text-8xl font-serif italic gold-gradient-text leading-none tracking-tighter">Pathwalker Network</h1>
              <p className="text-zinc-500 font-serif italic text-lg max-w-xl">Manage the network of emissaries and seekers spreading the word of the Yellow Path.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 backdrop-blur-3xl shadow-2xl">
               {(['partners', 'commissions', 'payouts'] as const).map((t) => (
                 <button
                   key={t}
                   onClick={() => setActiveTab(t)}
                   className={cn(
                     "px-8 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all duration-500",
                     activeTab === t ? "bg-primary text-black shadow-[0_0_20px_rgba(184,134,11,0.3)]" : "text-zinc-500 hover:text-white"
                   )}
                 >
                   {t}
                 </button>
               ))}
            </div>
          </header>

          {message && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-black tracking-widest flex items-center gap-3 rounded-[2rem] backdrop-blur-2xl shadow-2xl">
              <CheckCircle className="w-5 h-5" /> {message}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-3 group hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start">
                  <p className="text-[9px] uppercase font-black tracking-widest text-zinc-600">Pending Applications</p>
                  <Users className="w-4 h-4 text-amber-500/50" />
                </div>
                <p className="text-4xl text-amber-500 font-serif italic">{affiliates.filter(a => a.status === 'pending').length}</p>
                <p className="text-[8px] uppercase font-black tracking-widest text-zinc-800">Awaiting Ritual</p>
             </div>
             <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-3 group hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start">
                  <p className="text-[9px] uppercase font-black tracking-widest text-zinc-600">Active Partners</p>
                  <BadgeCheck className="w-4 h-4 text-emerald-500/50" />
                </div>
                <p className="text-4xl text-emerald-500 font-serif italic">{affiliates.filter(a => a.status === 'approved').length}</p>
                <p className="text-[8px] uppercase font-black tracking-widest text-zinc-800">Official Emissaries</p>
             </div>
             <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-3 group hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start">
                  <p className="text-[9px] uppercase font-black tracking-widest text-zinc-600">Pending Payouts</p>
                  <Wallet className="w-4 h-4 text-emerald-500/50" />
                </div>
                <p className="text-4xl text-emerald-500 font-serif italic">${pendingPayouts.toFixed(2)}</p>
                <p className="text-[8px] uppercase font-black tracking-widest text-zinc-800">Approved Commissions Ready</p>
             </div>
             <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-3 group hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start">
                  <p className="text-[9px] uppercase font-black tracking-widest text-zinc-600">Total Paid Out</p>
                  <DollarSign className="w-4 h-4 text-primary/50" />
                </div>
                <p className="text-4xl text-primary font-serif italic">${totalEarnings.toFixed(2)}</p>
                <p className="text-[8px] uppercase font-black tracking-widest text-zinc-800">Historical Distribution</p>
             </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel rounded-[3.5rem] border-white/5 overflow-hidden bg-black/20 backdrop-blur-xl"
            >
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-zinc-600 border-b border-white/5">
                       <tr>
                          {activeTab === 'partners' ? (
                            <>
                               <th className="p-8">Pathwalker</th>
                               <th className="p-8">Status</th>
                               <th className="p-8">Ritual Code</th>
                               <th className="p-8">Conversions</th>
                               <th className="p-8 text-right">Oversight</th>
                            </>
                          ) : (
                            <>
                               <th className="p-8">Edict ID</th>
                               <th className="p-8">Pathwalker</th>
                               <th className="p-8">Status</th>
                               <th className="p-8 text-right">Offerings</th>
                               <th className="p-8 text-right">Sanction</th>
                            </>
                          )}
                       </tr>
                    </thead>
                    <tbody className="text-sm font-serif italic text-white/70">
                       {activeTab === 'partners' ? (
                         affiliates.map((aff) => (
                           <tr key={aff.affiliateId} className="border-b border-white/5 group hover:bg-white/[0.03] transition-all">
                              <td className="p-8">
                                 <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center text-primary font-bold text-xl shadow-inner group-hover:scale-110 transition-transform">
                                       {aff.username?.[0] || 'P'}
                                    </div>
                                    <div>
                                       <p className="font-bold text-white not-italic text-lg">{aff.username}</p>
                                       <p className="text-[9px] text-zinc-700 uppercase font-black tracking-[0.1em]">Joined: {new Date(aff.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-8">
                                 <span className={cn(
                                   "px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-xl",
                                   aff.status === 'approved' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                   aff.status === 'pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                                 )}>
                                   {aff.status}
                                 </span>
                              </td>
                              <td className="p-8 text-zinc-500 tracking-tighter text-lg">{aff.referralCode}</td>
                              <td className="p-8">
                                 <div className="flex gap-6">
                                    <div className="space-y-1">
                                       <p className="text-[8px] uppercase font-black tracking-widest text-zinc-700">Signups</p>
                                       <p className="text-white text-lg">{aff.totalSignups || 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[8px] uppercase font-black tracking-widest text-zinc-700">Converts</p>
                                       <p className="text-emerald-500 text-lg">{aff.paidConversions || 0}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-8 text-right">
                                 <div className="flex justify-end gap-3">
                                    {aff.status === 'pending' && (
                                       <>
                                          <button onClick={() => updateAffiliateStatus(aff.affiliateId, 'approved')} className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/30 transition-all shadow-lg"><Check className="w-5 h-5" /></button>
                                          <button onClick={() => updateAffiliateStatus(aff.affiliateId, 'rejected')} className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/30 transition-all shadow-lg"><X className="w-5 h-5" /></button>
                                       </>
                                    )}
                                    {aff.status === 'approved' && (
                                       <button onClick={() => updateAffiliateStatus(aff.affiliateId, 'suspended')} className="p-3 rounded-xl bg-zinc-900 text-zinc-500 hover:bg-red-500/20 hover:text-red-500 transition-all shadow-xl"><AlertTriangle className="w-5 h-5" /></button>
                                    )}
                                    {aff.status === 'suspended' && (
                                       <button onClick={() => updateAffiliateStatus(aff.affiliateId, 'approved')} className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/30 transition-all"><RefreshCcw className="w-5 h-5" /></button>
                                    )}
                                 </div>
                              </td>
                           </tr>
                         ))
                       ) : (
                         commissions
                           .filter(c => activeTab === 'payouts' ? c.status === 'approved' : true)
                           .map((comm) => (
                           <tr key={comm.commissionId} className="border-b border-white/5 group hover:bg-white/[0.03] transition-all">
                              <td className="p-8 text-[11px] text-zinc-700 font-mono tracking-tighter">{comm.commissionId.toUpperCase()}</td>
                              <td className="p-8">
                                 <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-primary/40" />
                                    <span className="text-white not-italic font-bold">{comm.affiliateUserId.substring(0, 12)}...</span>
                                 </div>
                              </td>
                              <td className="p-8">
                                 <span className={cn(
                                   "px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                   comm.status === 'paid' ? "bg-primary text-black border-primary shadow-lg shadow-primary/20" :
                                   comm.status === 'approved' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                   comm.status === 'pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                                 )}>
                                   {comm.status}
                                 </span>
                              </td>
                              <td className="p-8 text-right">
                                 <div className="space-y-1">
                                    <p className="text-primary font-bold not-italic text-lg">${comm.commissionAmount.toFixed(2)}</p>
                                    <p className="text-[8px] uppercase font-black tracking-widest text-zinc-700">Gross: ${comm.grossAmount.toFixed(2)}</p>
                                 </div>
                              </td>
                              <td className="p-8 text-right">
                                 <div className="flex justify-end gap-3">
                                    {comm.status === 'pending' && (
                                       <button 
                                         onClick={() => updateCommissionStatus(comm.commissionId, 'approved')}
                                         className="px-6 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all shadow-lg"
                                       >
                                         Approve Offering
                                       </button>
                                    )}
                                    {comm.status === 'approved' && (
                                       <button 
                                         onClick={() => updateCommissionStatus(comm.commissionId, 'paid')}
                                         className="px-6 py-2.5 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-primary/20"
                                       >
                                         Distribute Payout
                                       </button>
                                    )}
                                 </div>
                              </td>
                           </tr>
                         ))
                       )}
                       {((activeTab === 'partners' && affiliates.length === 0) || (activeTab !== 'partners' && commissions.length === 0)) && (
                          <tr>
                             <td colSpan={5} className="p-24 text-center space-y-6">
                                <Search className="w-16 h-16 text-zinc-900 mx-auto" />
                                <div className="space-y-2">
                                  <p className="text-zinc-600 font-serif italic text-2xl">The chronicles are silent.</p>
                                  <p className="text-[10px] uppercase font-black tracking-widest text-zinc-800">No active records found in this section of the archive.</p>
                                </div>
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
               </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
