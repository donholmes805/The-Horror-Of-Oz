"use client";

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
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
  History
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, onSnapshot } from 'firebase/firestore';
import { BOT_OPPONENTS } from '@/constants/multiplayer';
import { MASTER_CARDS } from '@/constants/cards';
import { cn } from '@/lib/utils';
import { playSfx } from '@/lib/sfx';

export default function BotDuelPage() {
  const { user, profile } = useAuth();
  
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [combatState, setCombatState] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerInventoryCards, setPlayerInventoryCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [duelResult, setDuelResult] = useState<any>(null);
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (msg: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Fetch player cards in real-time
  useEffect(() => {
    if (!user) return;
    const cardsRef = collection(db, "users", user.uid, "playerCards");
    
    const unsubscribe = onSnapshot(cardsRef, (snapshot) => {
      const cards = snapshot.docs.map(doc => {
        const data = doc.data();
        const master = MASTER_CARDS.find(c => c.cardId === data.cardId);
        return master ? { ...master, id: doc.id } : null;
      }).filter(Boolean);
      setPlayerInventoryCards(cards);
    }, (err) => {
      console.error("Failed to fetch cards:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const initiateDuel = (botId: string) => {
    const bot = BOT_OPPONENTS[botId];
    setCombatState({
      enemy: bot,
      enemyHp: bot.health,
      playerHp: 15, // Fixed health for duels
      round: 1,
      logs: [`Duel started against ${bot.name}!`],
      isFinished: false,
      isVictorious: false
    });
    setSelectedBotId(botId);
    setDuelResult(null);
    playSfx('combat-start');
  };

  const performChallengeCheck = (base: number, difficulty: number, bonus: number = 0) => {
    const roll = Math.floor(Math.random() * 3); // 0-2 Risk Roll
    const total = base + bonus + roll;
    return total >= difficulty;
  };

  const handleAction = async (action: 'strike' | 'defend' | 'evade' | 'retreat') => {
    if (!combatState || combatState.isFinished || isProcessing) return;
    setIsProcessing(true);
    
    try {
      let playerDamage = 0;
      let enemyDamage = 0;
      let playerLog = "";
      let enemyLog = "";
      
      const cardBonus = selectedCardId ? (playerInventoryCards.find(c => c.id === selectedCardId)?.playableEffects?.find((e: any) => e.type === 'combat' || e.type === 'all')?.value || 1) : 0;

      switch(action) {
        case 'strike':
          playSfx('slash');
          const strikeSuccess = performChallengeCheck(5, combatState.enemy.defense, cardBonus);
          if (strikeSuccess) {
            enemyDamage = 2 + (cardBonus > 0 ? 1 : 0);
            playerLog = `You strike ${combatState.enemy.name} for ${enemyDamage} damage!`;
            playSfx('enemy-hit');
          } else {
            playerLog = `You swing at ${combatState.enemy.name} but miss.`;
          }
          break;
        case 'defend':
          playSfx('shield');
          playerLog = `You brace yourself. (Defense Boost)`;
          break;
        case 'evade':
          playSfx('evade');
          const evadeSuccess = performChallengeCheck(5, combatState.enemy.attack, cardBonus);
          if (evadeSuccess) {
            playerLog = `You nimbly dodge!`;
          } else {
            playerLog = `Dodge failed.`;
          }
          break;
        case 'retreat':
          setCombatState(null);
          setSelectedBotId(null);
          setIsProcessing(false);
          return;
      }

      // Enemy Turn
      if (combatState.enemyHp - enemyDamage > 0) {
        const enemyRoll = Math.floor(Math.random() * 20);
        const defenseBonus = action === 'defend' ? 5 : 0;
        if (enemyRoll > (10 + defenseBonus)) {
          playerDamage = 2;
          enemyLog = `${combatState.enemy.name} hits back! (-2 Health)`;
          playSfx('player-hit');
        } else {
          enemyLog = `${combatState.enemy.name} misses their attack.`;
        }
      }

      const nextEnemyHp = Math.max(0, combatState.enemyHp - enemyDamage);
      const nextPlayerHp = Math.max(0, combatState.playerHp - playerDamage);
      const isWin = nextEnemyHp <= 0;
      const isLoss = nextPlayerHp <= 0;

      setCombatState((prev: any) => ({
        ...prev,
        enemyHp: nextEnemyHp,
        playerHp: nextPlayerHp,
        round: prev.round + 1,
        logs: [enemyLog, playerLog, ...prev.logs].filter(l => l !== "").slice(0, 10),
        isFinished: isWin || isLoss,
        isVictorious: isWin
      }));

      if (isWin) {
        setDuelResult({
          status: 'victory',
          shards: combatState.enemy.difficulty === 'easy' ? 5 : combatState.enemy.difficulty === 'medium' ? 10 : 20
        });
        if (user) {
          await updateDoc(doc(db, "users", user.uid), { yellowShards: increment(combatState.enemy.difficulty === 'easy' ? 5 : 10) });
          addToast(`Victory! Gained ${combatState.enemy.difficulty === 'easy' ? 5 : 10} Shards.`);
        }
      } else if (isLoss) {
        setDuelResult({ status: 'defeat', shards: 2 });
        if (user) {
          await updateDoc(doc(db, "users", user.uid), { yellowShards: increment(2) });
          addToast("Defeat. Gained 2 Shards for effort.");
        }
      }

    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MainLayout>
      <div className="relative min-h-screen pt-24 pb-20 px-6 max-w-5xl mx-auto z-10">
        {/* Cinematic Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-radial-vignette opacity-60" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-900/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        {/* Toasts */}
        <div className="fixed bottom-10 left-10 z-[100] space-y-4">
           <AnimatePresence>
             {toasts.map(t => (
               <motion.div 
                 key={t.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="glass-panel px-6 py-4 rounded-2xl border-primary/20 bg-black/80 text-primary text-[10px] uppercase font-black tracking-widest flex items-center gap-3"
               >
                 <Sparkles className="w-4 h-4" />
                 {t.msg}
               </motion.div>
             ))}
           </AnimatePresence>
        </div>

        {!combatState ? (
          <div className="space-y-12">
            <header className="space-y-4 text-center">
              <span className="text-[10px] uppercase font-black tracking-[0.6em] text-primary">Combat Training</span>
              <h1 className="text-5xl md:text-7xl text-white font-serif italic">Bot Duel Protocol</h1>
              <p className="text-zinc-500 font-serif italic text-lg max-w-xl mx-auto">
                Test your relics against simulated threats. Training missions grant small amounts of Yellow Shards.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.values(BOT_OPPONENTS).map((bot) => (
                <motion.div
                  key={bot.id}
                  whileHover={{ scale: 1.02 }}
                  className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-6 flex flex-col"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-2xl text-white font-serif italic">{bot.name}</h3>
                      <span className={cn(
                        "text-[9px] uppercase font-black tracking-widest",
                        bot.difficulty === 'easy' ? "text-emerald-500" : 
                        bot.difficulty === 'medium' ? "text-blue-500" :
                        bot.difficulty === 'hard' ? "text-purple-500" : "text-red-500"
                      )}>
                        {bot.difficulty} Difficulty
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-zinc-500" />
                    </div>
                  </div>
                  
                  <p className="text-xs text-zinc-500 font-serif italic flex-1">{bot.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="text-center">
                      <p className="text-[8px] text-zinc-600 uppercase font-black">HP</p>
                      <p className="text-lg text-white font-serif italic">{bot.health}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-zinc-600 uppercase font-black">ATK</p>
                      <p className="text-lg text-white font-serif italic">{bot.attack}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-zinc-600 uppercase font-black">DEF</p>
                      <p className="text-lg text-white font-serif italic">{bot.defense}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => initiateDuel(bot.id)}
                    className="w-full premium-button premium-button-gold py-4 text-[10px] uppercase font-black tracking-widest"
                  >
                    Initiate Combat
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Duel Combat UI */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCombatState(null)}
                className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] uppercase font-black"
              >
                <LogOut className="w-4 h-4" />
                Abort Training
              </button>
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Round {combatState.round}</span>
                <div className="h-px w-8 bg-zinc-800" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               {/* Enemy Section */}
               <div className="space-y-6">
                 <div className="glass-panel p-8 rounded-[3rem] border-red-900/20 bg-zinc-950/50 relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase font-black text-red-500 tracking-widest">Active Target</span>
                          <h2 className="text-4xl text-white font-serif italic">{combatState.enemy.name}</h2>
                        </div>
                        <span className="text-2xl text-white font-serif italic">{combatState.enemyHp} / {combatState.enemy.health}</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          animate={{ width: `${(combatState.enemyHp / combatState.enemy.health) * 100}%` }}
                          className="h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                        />
                      </div>
                    </div>
                    <Skull className="w-48 h-48 text-red-600/5 absolute bottom-0 right-0 -mr-12 -mb-12" />
                 </div>

                 {/* Logs */}
                 <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 h-48 overflow-y-auto scrollbar-hide space-y-3">
                    {combatState.logs.map((log: string, i: number) => (
                      <p key={i} className={cn(
                        "text-[11px] font-serif italic leading-relaxed",
                        i === 0 ? "text-white" : "text-zinc-500 opacity-60"
                      )}>
                        {log}
                      </p>
                    ))}
                 </div>
               </div>

               {/* Player Section */}
               <div className="space-y-6">
                 <div className="glass-panel p-8 rounded-[3rem] border-primary/20 bg-zinc-950/50">
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase font-black text-primary tracking-widest">Your Condition</span>
                          <h2 className="text-4xl text-white font-serif italic">Pathwalker</h2>
                        </div>
                        <span className="text-2xl text-white font-serif italic">{combatState.playerHp} / 15</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          animate={{ width: `${(combatState.playerHp / 15) * 100}%` }}
                          className="h-full bg-primary shadow-[0_0_15px_rgba(200,155,44,0.5)]"
                        />
                      </div>
                    </div>
                 </div>

                 {/* Actions */}
                 {!combatState.isFinished ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleAction('strike')}
                        disabled={isProcessing}
                        className="premium-button premium-button-gold py-6 flex flex-col items-center gap-2"
                      >
                        <Sword className="w-5 h-5" />
                        <span className="text-[10px] uppercase font-black">Strike</span>
                      </button>
                      <button 
                        onClick={() => handleAction('defend')}
                        disabled={isProcessing}
                        className="glass-panel p-6 border-white/10 hover:bg-white/5 flex flex-col items-center gap-2"
                      >
                        <Shield className="w-5 h-5 text-zinc-400" />
                        <span className="text-[10px] uppercase font-black text-zinc-400">Defend</span>
                      </button>
                      <button 
                        onClick={() => handleAction('evade')}
                        disabled={isProcessing}
                        className="glass-panel p-6 border-white/10 hover:bg-white/5 flex flex-col items-center gap-2"
                      >
                        <Wind className="w-5 h-5 text-zinc-400" />
                        <span className="text-[10px] uppercase font-black text-zinc-400">Evade</span>
                      </button>
                      <button 
                        onClick={() => setSelectedCardId(selectedCardId ? null : (playerInventoryCards[0]?.id || null))}
                        className={cn(
                          "glass-panel p-6 border-white/10 flex flex-col items-center gap-2 transition-all",
                          selectedCardId ? "bg-primary/20 border-primary" : "hover:bg-white/5"
                        )}
                      >
                        <Zap className={cn("w-5 h-5", selectedCardId ? "text-primary" : "text-zinc-400")} />
                        <span className={cn("text-[10px] uppercase font-black", selectedCardId ? "text-primary" : "text-zinc-400")}>
                          {selectedCardId ? 'Relic Active' : 'Use Relic'}
                        </span>
                      </button>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className={cn(
                         "p-8 rounded-[2rem] border text-center space-y-4",
                         combatState.isVictorious ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
                       )}>
                          <Trophy className={cn("w-12 h-12 mx-auto", combatState.isVictorious ? "text-emerald-500" : "text-zinc-700")} />
                          <h3 className="text-3xl text-white font-serif italic">
                            {combatState.isVictorious ? "Simulation Success" : "Simulation Halted"}
                          </h3>
                          <p className="text-sm text-zinc-400 font-serif italic">
                            {combatState.isVictorious ? "Your tactical prowess has been recorded." : "The threat exceeded your current readiness."}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                             <Sparkles className="w-4 h-4 text-primary" />
                             <span className="text-xl text-primary font-serif italic">+{duelResult?.shards || 0} Shards</span>
                          </div>
                       </div>
                       <button 
                        onClick={() => setCombatState(null)}
                        className="w-full premium-button premium-button-gold py-6 text-[10px] uppercase font-black tracking-widest"
                       >
                         Return to Hub
                       </button>
                    </div>
                 )}
               </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
