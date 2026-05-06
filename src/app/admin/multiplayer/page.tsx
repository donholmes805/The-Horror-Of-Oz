"use client";

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Search, 
  Users, 
  History, 
  Activity, 
  X, 
  Eye, 
  AlertTriangle,
  RefreshCw,
  MoreVertical,
  ArrowRight,
  ShieldCheck,
  Zap,
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isInternalUser } from '@/lib/auth-utils';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminMultiplayerPage() {
  const { user, profile } = useAuth();
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const isOwner = isInternalUser(profile);

  useEffect(() => {
    if (!isOwner) return;
    
    const q = query(collection(db, "gameRooms"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setActiveRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOwner]);

  const handleForceClose = async (roomId: string) => {
    if (!confirm("Are you sure you want to force-close this room? This will kick all players.")) return;
    try {
      await updateDoc(doc(db, "gameRooms", roomId), { status: 'canceled' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Permanently delete this room record?")) return;
    try {
      await deleteDoc(doc(db, "gameRooms", roomId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOwner) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <ShieldAlert className="w-16 h-16 text-red-600 mx-auto animate-pulse" />
            <h1 className="text-3xl text-white font-serif italic">Access Denied</h1>
            <p className="text-zinc-500 font-serif italic">You do not have administrative clearance for the Arena.</p>
            <Link href="/play" className="block text-primary hover:underline uppercase text-[10px] font-black tracking-widest">Return to Hub</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const filteredRooms = activeRooms.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.hostUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.inviteCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = activeRooms.filter(r => r.status === 'active').length;
  const waitingCount = activeRooms.filter(r => r.status === 'waiting').length;

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-red-600">Arena Oversight</span>
            </div>
            <h1 className="text-5xl text-white font-serif italic">Multiplayer Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="glass-panel px-6 py-3 rounded-full border-white/5 bg-white/5 text-[10px] uppercase font-black tracking-widest text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Keeper Mode Active
             </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: "Active Duels", value: activeCount, icon: <Activity className="w-4 h-4" />, color: "text-emerald-500" },
             { label: "Waiting Rooms", value: waitingCount, icon: <Users className="w-4 h-4" />, color: "text-blue-500" },
             { label: "Total Monitored", value: activeRooms.length, icon: <History className="w-4 h-4" />, color: "text-primary" },
             { label: "System Health", value: "Optimal", icon: <Zap className="w-4 h-4" />, color: "text-amber-500" },
           ].map((stat, i) => (
             <div key={i} className="glass-panel p-6 rounded-3xl border-white/5 bg-black/40 space-y-2">
                <div className="flex items-center justify-between">
                   <span className="text-[8px] uppercase font-black tracking-widest text-zinc-500">{stat.label}</span>
                   <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>{stat.icon}</div>
                </div>
                <p className="text-3xl text-white font-serif italic">{stat.value}</p>
             </div>
           ))}
        </div>

        {/* Room Table */}
        <div className="glass-panel rounded-[3rem] border-white/5 bg-black/40 overflow-hidden">
           <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl text-white font-serif italic">Engagement Monitoring</h2>
              <div className="relative w-72">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Search ID, Host, or Code..."
                   className="w-full bg-zinc-950 border border-white/5 rounded-full pl-12 pr-4 py-2 text-xs text-zinc-400 focus:outline-none focus:border-primary/50 transition-colors"
                 />
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                       <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-zinc-500">Room Details</th>
                       <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-zinc-500">Invite</th>
                       <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-zinc-500">Players</th>
                       <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-zinc-500">Status</th>
                       <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-zinc-500">Created</th>
                       <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-zinc-500">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="px-8 py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-700" /></td></tr>
                    ) : filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                           <div className="space-y-4">
                              <Activity className="w-12 h-12 text-zinc-800 mx-auto" />
                              <p className="text-sm text-zinc-600 font-serif italic">No matching sessions detected.</p>
                           </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRooms.map((room) => (
                        <tr key={room.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                           <td className="px-8 py-6">
                              <div className="space-y-1">
                                 <p className="text-[10px] text-white font-mono">{room.id}</p>
                                 <p className="text-[9px] text-zinc-600 uppercase font-black">Host: {room.hostUserId}</p>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-sm font-black text-primary tracking-widest">
                                 {room.inviteCode || "—"}
                              </span>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                 <Users className="w-3 h-3 text-zinc-500" />
                                 <span className="text-xs text-zinc-300 font-serif italic">{room.playerIds?.length || 0} / {room.maxPlayers}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                 <div className={cn(
                                   "w-1.5 h-1.5 rounded-full animate-pulse",
                                   room.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                                   room.status === 'waiting' ? "bg-blue-500" : "bg-zinc-700"
                                 )} />
                                 <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400">{room.status}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-xs text-zinc-500 font-serif italic">
                                 {room.createdAt?.toDate().toLocaleTimeString() || "N/A"}
                              </p>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <Link href={`/play/room/${room.id}`}>
                                   <button className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all" title="Spectate/Join">
                                      <Eye className="w-4 h-4" />
                                   </button>
                                 </Link>
                                 {room.status !== 'completed' && room.status !== 'canceled' && (
                                   <button 
                                     onClick={() => handleForceClose(room.id)}
                                     className="p-2 rounded-lg bg-red-900/10 text-red-900/40 hover:text-red-500 hover:bg-red-900/20 transition-all" 
                                     title="Force Close"
                                   >
                                      <X className="w-4 h-4" />
                                   </button>
                                 )}
                                 <button 
                                   onClick={() => handleDeleteRoom(room.id)}
                                   className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-500 hover:bg-white/10 transition-all" 
                                   title="Delete Record"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>

           <div className="p-8 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-600 uppercase font-black tracking-widest">
              <span>Monitoring {filteredRooms.length} Active Buffers</span>
              <div className="flex items-center gap-4">
                 <button className="p-2 rounded-lg hover:bg-white/5 transition-all opacity-50 cursor-not-allowed">Previous</button>
                 <button className="p-2 rounded-lg hover:bg-white/5 transition-all opacity-50 cursor-not-allowed">Next</button>
              </div>
           </div>
        </div>

        {/* Engagement Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="glass-panel p-10 rounded-[3rem] border-white/5 bg-black/40 space-y-6">
              <div className="flex items-center gap-4">
                 <Activity className="w-5 h-5 text-primary" />
                 <h2 className="text-2xl text-white font-serif italic">Global Arena Events</h2>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-hide">
                 {/* This would ideally pull from gameRoomEvents collection */}
                 <p className="text-[10px] text-zinc-600 font-serif italic">Streaming real-time engagement logs...</p>
                 <div className="space-y-3">
                    {[
                      "User_82 joined Room OZ-KJ882",
                      "Room OZ-LP229 transitioned to ACTIVE",
                      "Match Result: Winner User_44, Loser User_12",
                      "Invite Code OZ-XP991 expired"
                    ].map((log, i) => (
                      <div key={i} className="flex gap-4 text-[11px] font-serif italic border-l border-white/5 pl-4">
                         <span className="text-zinc-600 shrink-0">{new Date().toLocaleTimeString()}</span>
                         <span className="text-blue-500">{log}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="glass-panel p-10 rounded-[3rem] border-red-900/20 bg-red-950/5 space-y-6">
              <div className="flex items-center gap-4">
                 <AlertTriangle className="w-5 h-5 text-red-500" />
                 <h2 className="text-2xl text-white font-serif italic">Danger Zone</h2>
              </div>
              <p className="text-xs text-zinc-500 font-serif italic">Critical system controls for the multiplayer engine.</p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button className="glass-panel p-4 border-red-900/20 bg-red-900/5 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-900/10 transition-all">
                    Reset Lobby Buffer
                 </button>
                 <button className="glass-panel p-4 border-red-900/20 bg-red-900/5 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-900/10 transition-all">
                    Prune Stale Rooms
                 </button>
              </div>
           </div>
        </div>
      </div>
    </MainLayout>
  );
}
