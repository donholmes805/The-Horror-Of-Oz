"use client";

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Sword, 
  Shield, 
  Wind, 
  LogOut, 
  Heart, 
  Sparkles, 
  Skull,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Copy,
  Check,
  Loader2,
  User,
  ShieldCheck,
  ZapOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { MASTER_CARDS } from '@/constants/cards';
import { cn } from '@/lib/utils';
import { playSfx } from '@/lib/sfx';
import { useRouter, useParams } from 'next/navigation';
import { 
  setPlayerReady, 
  startPvpMatch, 
  submitPvpAction, 
  leavePvpRoom,
  surrenderPvpMatch 
} from '../../pvp/actions';
import { StatPop } from '@/components/shared/GameEffects';

export default function PvpRoomPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [effects, setEffects] = useState<any[]>([]);

  // Room & Players Sync
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "gameRooms", roomId);
    const unsubscribeRoom = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) {
        router.push('/play/pvp');
        return;
      }
      const data = snap.data();
      setRoom({ ...data, id: snap.id });

      // Play SFX on state changes
      if (data.status === 'active' && room?.status === 'waiting') {
        playSfx('combat-start');
      }
      if (data.status === 'completed' && room?.status === 'active') {
        playSfx(data.winnerUserId === user?.uid ? 'victory' : 'defeat');
      }
    });

    const playersRef = collection(db, "gameRooms", roomId, "players");
    const unsubscribePlayers = onSnapshot(playersRef, (snap) => {
      const pList = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setPlayers(pList);
    });

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
    };
  }, [roomId, user?.uid]);

  const addEffect = (value: string | number, type: any) => {
    const id = Math.random().toString(36).substring(7);
    setEffects(prev => [...prev, { id, value, type, x: window.innerWidth / 2, y: window.innerHeight / 2 }]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== id));
    }, 2000);
  };

  const handleCopyCode = () => {
    if (!room?.inviteCode) return;
    navigator.clipboard.writeText(room.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReadyToggle = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    const currentPlayer = players.find(p => p.userId === user.uid);
    await setPlayerReady(roomId, user.uid, !currentPlayer?.ready);
    setIsProcessing(false);
  };

  const handleStartMatch = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    const res = await startPvpMatch(roomId, user.uid);
    if (!res.success) setError(res.error);
    setIsProcessing(false);
  };

  const handleAction = async (action: string) => {
    if (!user || isProcessing || room.currentTurnUserId !== user.uid) return;
    setIsProcessing(true);
    
    // SFX for local feedback
    if (action === 'strike') playSfx('slash');
    if (action === 'defend') playSfx('shield');
    if (action === 'evade') playSfx('evade');

    const res = await submitPvpAction(roomId, user.uid, action, { cardId: selectedCardId });
    if (!res.success) setError(res.error);
    
    setIsProcessing(false);
  };

  const handleLeave = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    await leavePvpRoom(roomId, user.uid);
    router.push('/play/pvp');
  };

  if (!room || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const me = players.find(p => p.userId === user.uid);
  const opponent = players.find(p => p.userId !== user.uid);
  const isMyTurn = room.currentTurnUserId === user.uid;

  return (
    <MainLayout>
      <div className="relative min-h-screen pt-24 pb-20 px-6 max-w-6xl mx-auto z-10">
        {/* Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-radial-vignette opacity-80" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Effects Layer */}
        <AnimatePresence>
          {effects.map(eff => (
            <StatPop key={eff.id} {...eff} />
          ))}
        </AnimatePresence>

        {room.status === 'waiting' ? (
          /* LOBBY VIEW */
          <div className="space-y-12 max-w-3xl mx-auto">
            <header className="text-center space-y-4">
              <span className="text-[10px] uppercase font-black tracking-[0.6em] text-primary">Secure Channel Established</span>
              <h1 className="text-5xl md:text-7xl text-white font-serif italic">Private Lobby</h1>
              <div className="flex items-center justify-center gap-4 pt-4">
                <div 
                  onClick={handleCopyCode}
                  className="glass-panel px-6 py-3 rounded-2xl border-white/10 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all bg-black/60 group"
                >
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase font-black text-zinc-600 tracking-widest text-left">Invite Code</p>
                    <p className="text-2xl font-black text-primary tracking-[0.1em]">{room.inviteCode}</p>
                  </div>
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />}
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Player Slots */}
               {[0, 1].map(index => {
                 const p = players[index];
                 return (
                   <div key={index} className={cn(
                     "glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-6 flex flex-col items-center",
                     p ? "border-primary/20" : "border-dashed border-zinc-800 opacity-40"
                   )}>
                      {p ? (
                        <>
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                               {p.avatar ? <img src={p.avatar} alt={p.username} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-zinc-700" />}
                            </div>
                            {p.ready && (
                              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <h3 className="text-2xl text-white font-serif italic">{p.username}</h3>
                            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500">{p.userId === room.hostUserId ? "Keeper of Room" : "Guest Pathwalker"}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                           <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
                              <Users className="w-8 h-8 text-zinc-800" />
                           </div>
                           <p className="text-[10px] uppercase font-black tracking-widest text-zinc-700">Waiting for Rival...</p>
                        </div>
                      )}
                   </div>
                 );
               })}
            </div>

            <div className="flex flex-col items-center gap-6">
              {me && (
                <button 
                  onClick={handleReadyToggle}
                  className={cn(
                    "w-full max-w-sm py-5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all",
                    me.ready ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500" : "premium-button premium-button-gold"
                  )}
                >
                  {me.ready ? "Ready to Duel" : "Signal Readiness"}
                </button>
              )}

              {room.hostUserId === user.uid && players.length === 2 && players.every(p => p.ready) && (
                <button 
                  onClick={handleStartMatch}
                  className="w-full max-w-sm premium-button premium-button-red py-5 rounded-2xl flex items-center justify-center gap-3 animate-pulse"
                >
                  <Sword className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-black tracking-widest">Commence Combat</span>
                </button>
              )}

              <button 
                onClick={handleLeave}
                className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] uppercase font-black tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                Abandon Room
              </button>
            </div>
          </div>
        ) : room.status === 'active' ? (
          /* ARENA VIEW */
          <div className="space-y-8">
            <header className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="px-4 py-2 rounded-full bg-red-950/30 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest">
                     Match Protocol Active
                  </div>
                  <span className="text-zinc-600 font-serif italic">Round {room.currentRound}</span>
               </div>
               <button 
                onClick={() => { if(confirm("Surrender match?")) surrenderPvpMatch(roomId, user.uid); }}
                className="text-zinc-700 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] uppercase font-black"
               >
                 <ZapOff className="w-4 h-4" />
                 Surrender
               </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               {/* Opponent Card */}
               <div className="space-y-6">
                  <motion.div 
                    animate={room.currentTurnUserId === opponent?.userId ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={cn(
                      "glass-panel p-8 rounded-[3rem] border-zinc-800/20 bg-zinc-950/50 relative overflow-hidden",
                      room.currentTurnUserId === opponent?.userId && "border-red-500/40"
                    )}
                  >
                     <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-end">
                           <div className="space-y-1">
                              <span className="text-[8px] uppercase font-black text-red-500 tracking-widest">Target Rival</span>
                              <h2 className="text-4xl text-white font-serif italic">{opponent?.username || "Pathwalker"}</h2>
                           </div>
                           <div className="text-right">
                              <span className="text-2xl text-white font-serif italic">{opponent?.stats?.health} / 15</span>
                              <p className="text-[8px] uppercase font-black text-zinc-600">Integrity</p>
                           </div>
                        </div>
                        <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                           <motion.div 
                             animate={{ width: `${(opponent?.stats?.health / 15) * 100}%` }}
                             className="h-full bg-gradient-to-r from-red-800 to-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                           />
                        </div>
                        <div className="flex gap-4 pt-2">
                           {opponent?.roomState?.defending && (
                             <div className="flex items-center gap-1 text-[10px] text-blue-400 font-black uppercase">
                               <ShieldCheck className="w-3 h-3" /> Braced
                             </div>
                           )}
                           {opponent?.roomState?.evading && (
                             <div className="flex items-center gap-1 text-[10px] text-amber-500 font-black uppercase">
                               <Wind className="w-3 h-3" /> Evasive
                             </div>
                           )}
                        </div>
                     </div>
                     <Skull className="w-48 h-48 text-red-600/5 absolute bottom-0 right-0 -mr-12 -mb-12" />
                  </motion.div>

                  {/* Log Card */}
                  <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 h-64 overflow-y-auto scrollbar-hide space-y-4">
                     <p className="text-[8px] uppercase font-black text-zinc-600 tracking-widest border-b border-white/5 pb-2">Arena Log</p>
                     <div className="space-y-3">
                        <p className="text-[12px] text-white font-serif italic leading-relaxed animate-pulse">
                           {room.roomState?.lastLog || "Awaiting first strike..."}
                        </p>
                        <div className="h-px w-full bg-white/5" />
                        <p className="text-[10px] text-zinc-600 font-serif italic">
                           Tactical Round {room.currentRound} initialized.
                        </p>
                     </div>
                  </div>
               </div>

               {/* Your Card */}
               <div className="space-y-6">
                  <div className={cn(
                    "glass-panel p-8 rounded-[3rem] border-primary/20 bg-zinc-950/50 relative overflow-hidden",
                    isMyTurn && "border-primary shadow-[0_0_40px_rgba(184,134,11,0.1)]"
                  )}>
                     <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-end">
                           <div className="space-y-1">
                              <span className="text-[8px] uppercase font-black text-primary tracking-widest">Your Condition</span>
                              <h2 className="text-4xl text-white font-serif italic">The Pathwalker</h2>
                           </div>
                           <div className="text-right">
                              <span className="text-2xl text-white font-serif italic">{me?.stats?.health} / 15</span>
                              <p className="text-[8px] uppercase font-black text-zinc-600">Integrity</p>
                           </div>
                        </div>
                        <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                           <motion.div 
                             animate={{ width: `${(me?.stats?.health / 15) * 100}%` }}
                             className="h-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_15px_rgba(184,134,11,0.3)]"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Actions Section */}
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Tactical Options</h4>
                        {isMyTurn ? (
                           <span className="text-primary text-[10px] font-black animate-pulse">YOUR TURN</span>
                        ) : (
                           <span className="text-zinc-700 text-[10px] font-black">OPPONENT ACTING</span>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => handleAction('strike')}
                          disabled={!isMyTurn || isProcessing}
                          className="premium-button premium-button-gold py-6 flex flex-col items-center gap-2 relative overflow-hidden group disabled:opacity-40"
                        >
                           <Sword className="w-6 h-6" />
                           <span className="text-[10px] uppercase font-black">Strike</span>
                           <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform" />
                        </button>
                        <button 
                          onClick={() => handleAction('defend')}
                          disabled={!isMyTurn || isProcessing}
                          className="glass-panel p-6 border-white/10 hover:bg-white/5 flex flex-col items-center gap-2 disabled:opacity-40"
                        >
                           <Shield className="w-6 h-6 text-zinc-400" />
                           <span className="text-[10px] uppercase font-black text-zinc-400">Defend</span>
                        </button>
                        <button 
                          onClick={() => handleAction('evade')}
                          disabled={!isMyTurn || isProcessing}
                          className="glass-panel p-6 border-white/10 hover:bg-white/5 flex flex-col items-center gap-2 disabled:opacity-40"
                        >
                           <Wind className="w-6 h-6 text-zinc-400" />
                           <span className="text-[10px] uppercase font-black text-zinc-400">Evade</span>
                        </button>
                        <button 
                          className="glass-panel p-6 border-white/10 hover:bg-white/5 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed"
                        >
                           <Zap className="w-6 h-6 text-zinc-600" />
                           <span className="text-[10px] uppercase font-black text-zinc-600">Relic (Beta)</span>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          /* COMPLETED VIEW */
          <div className="max-w-xl mx-auto text-center space-y-8">
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="glass-panel p-12 rounded-[3rem] border-primary/20 bg-zinc-950/80 space-y-8"
             >
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150" />
                   <Trophy className={cn(
                     "w-24 h-24 mx-auto relative z-10",
                     room.winnerUserId === user.uid ? "text-primary shadow-[0_0_30px_rgba(184,134,11,0.5)]" : "text-zinc-700"
                   )} />
                </div>

                <div className="space-y-2">
                   <h2 className="text-5xl text-white font-serif italic">
                     {room.winnerUserId === user.uid ? "Victorious" : "Defeated"}
                   </h2>
                   <p className="text-zinc-500 font-serif italic">
                     {room.winnerUserId === user.uid 
                       ? "You have proven your tactical superiority in the Yellow Path simulation." 
                       : "The simulation has ended. Analyze your failures and return stronger."}
                   </p>
                </div>

                <div className="flex items-center justify-center gap-4 py-4 border-y border-white/5">
                   <div className="text-center">
                      <p className="text-[8px] text-zinc-600 uppercase font-black">Shards Earned</p>
                      <p className="text-2xl text-primary font-serif italic">+{room.winnerUserId === user.uid ? 5 : 0}</p>
                   </div>
                </div>

                <button 
                  onClick={() => router.push('/play/pvp')}
                  className="w-full premium-button premium-button-gold py-5 rounded-2xl text-[10px] uppercase font-black tracking-widest"
                >
                  Return to Arena Hub
                </button>
             </motion.div>
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] glass-panel px-8 py-4 rounded-full border-red-500/20 bg-black/90 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-zinc-500 hover:text-white">Close</button>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
