"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { BOOK_I_NODES, Node } from "@/constants/campaign";
import { MASTER_CARDS, MasterCard } from "@/constants/cards";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  MapPin, 
  Skull, 
  Search, 
  Zap,
  ChevronRight,
  Info,
  Key,
  Shield,
  Eye,
  Heart,
  Timer,
  CheckCircle2,
  Sword,
  Backpack,
  AlertCircle,
  Book,
  Crosshair,
  Sparkles,
  Wind,
  ShieldCheck,
  Navigation,
  Compass,
  Flame,
  GripHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, updateDoc, getDoc, arrayUnion, onSnapshot, serverTimestamp, setDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BetaNotice } from "@/components/shared/BetaNotice";
import Link from "next/link";

export default function CampaignBoard() {
  const { user, profile } = useAuth();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [activeEncounter, setActiveEncounter] = useState<any>(null);
  const [activeReward, setActiveReward] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = (node: Node) => {
    if (progress?.revealedNodes.includes(node.id)) {
      setSelectedNode(node);
    }
  };

  const centerOnCurrentNode = () => {
    if (!progress?.currentNode) return;
    const node = BOOK_I_NODES.find(n => n.id === progress.currentNode);
    if (node) {
      const container = document.getElementById("map-container");
      if (container) {
        const x = (node.x * 12) - (window.innerWidth / 2);
        container.scrollTo({ left: x, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Safety timeout to clear loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    const unsubProgress = onSnapshot(doc(db, "playerProgress", user.uid), 
      (doc) => {
        setProgress(doc.data());
        setLoading(false);
        clearTimeout(timeout);
      },
      (error) => {
        console.error("Campaign progress sync error:", error);
        setLoading(false);
        clearTimeout(timeout);
      }
    );

    const unsubStats = onSnapshot(doc(db, "playerStats", user.uid), 
      (doc) => {
        setStats(doc.data());
      },
      (error) => {
        console.error("User stats sync error:", error);
      }
    );

    return () => {
      unsubProgress();
      unsubStats();
      clearTimeout(timeout);
    };
  }, [user]);

  const handleEndTurn = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "playerProgress", user.uid), {
        actionPoints: 3,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkRequirements = (node: Node) => {
    if (!node.requirements) return true;
    const { key, stat, event, OR, AND } = node.requirements;
    
    if (key && !progress.inventoryKeys.includes(key)) return false;
    if (stat && stats[stat.name as keyof typeof stats] < stat.value) return false;
    if (event && !progress.completedNodes.includes(event)) return false;
    
    if (OR && Array.isArray(OR)) {
      const anyMet = OR.some(req => {
        if (req.key && progress.inventoryKeys.includes(req.key)) return true;
        if (req.stat && stats[req.stat.name as keyof typeof stats] >= req.stat.value) return true;
        if (req.event && progress.completedNodes.includes(req.event)) return true;
        return false;
      });
      if (!anyMet) return false;
    }

    if (AND) {
      if (Array.isArray(AND)) {
        const allMet = AND.every(req => {
          if (req.key && !progress.inventoryKeys.includes(req.key)) return false;
          if (req.stat && stats[req.stat.name as keyof typeof stats] < req.stat.value) return false;
          if (req.event && !progress.completedNodes.includes(req.event)) return false;
          return true;
        });
        if (!allMet) return false;
      } else {
        if (AND.key && !progress.inventoryKeys.includes(AND.key)) return false;
        if (AND.items && progress.mapFragments < AND.items) return false;
      }
    }

    return true;
  };

  const handleMove = async (node: Node) => {
    if (!user || !progress || progress.actionPoints < 1 || isProcessing) return;
    
    if (!checkRequirements(node)) return;

    setIsProcessing(true);
    try {
      const updates: any = {
        currentNode: node.id,
        actionPoints: progress.actionPoints - 1,
        visitedNodes: arrayUnion(node.id),
        updatedAt: serverTimestamp()
      };

      const neighbors = node.connectedNodes;
      updates.unlockedNodes = arrayUnion(...neighbors);
      
      await updateDoc(doc(db, "playerProgress", user.uid), updates);
      setSelectedNode(null);

      if (node.eventId && !progress.completedNodes.includes(node.eventId)) {
        triggerStoryEvent(node.eventId);
      } else if (node.type === "Encounter" || node.type === "DangerPath") {
        triggerEncounter(node);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async (node: Node) => {
    if (!user || !progress || progress.actionPoints < 1 || isProcessing) return;
    setIsProcessing(true);
    try {
      const pool = getSearchPool(node.id);
      const result = pool[Math.floor(Math.random() * pool.length)];
      
      const updates: any = {
        actionPoints: progress.actionPoints - 1,
        updatedAt: serverTimestamp()
      };

      if (result.type === "key") {
        updates.inventoryKeys = arrayUnion(result.id);
      } else if (result.type === "fragment") {
        updates.mapFragments = progress.mapFragments + 1;
      } else if (result.type === "card") {
        await grantCard(result.id, "search");
      }

      await updateDoc(doc(db, "playerProgress", user.uid), updates);
      setActiveReward(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerStoryEvent = (eventId: string) => {
    if (eventId === "book1_story_rescue_thatch") {
      setActiveEvent({
        id: eventId,
        title: "Rescue Sir Hollin Thatch",
        description: "A man of straw hangs from the gallows, surrounded by a jeering mob of Tin Enforcers.",
        choices: [
          { 
            id: "c1", 
            label: "Stand Against the Mob", 
            req: "Courage 3", 
            canDo: stats.courage >= 3,
            result: "Unlock Sir Hollin Thatch ally, +1 Courage"
          },
          { 
            id: "c2", 
            label: "Sneak Around the Gallows", 
            req: "Memory 2", 
            canDo: stats.memory >= 2,
            result: "Unlock Sir Hollin Thatch ally"
          },
          { 
            id: "c3", 
            label: "Call for Mercy", 
            req: "Hope 3", 
            canDo: stats.hope >= 3,
            result: "Unlock Sir Hollin Thatch ally, +1 Hope"
          }
        ]
      });
    }
  };

  const handleEventChoice = async (choice: any) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      const updates: any = {
        completedNodes: arrayUnion(activeEvent.id),
        alliesUnlocked: arrayUnion("sir-hollin-thatch"),
        updatedAt: serverTimestamp()
      };

      if (progress.questProgress?.book1_quest_first_step?.status === "active") {
        const quest = progress.questProgress.book1_quest_first_step;
        if (!quest.steps.includes("rescue_thatch")) {
          updates[`questProgress.book1_quest_first_step.steps`] = arrayUnion("rescue_thatch");
        }
      }

      await updateDoc(doc(db, "playerProgress", user.uid), updates);
      
      if (choice.id === "c1") await updateDoc(doc(db, "playerStats", user.uid), { courage: increment(1) });
      if (choice.id === "c3") await updateDoc(doc(db, "playerStats", user.uid), { hope: increment(1) });

      setActiveEvent(null);
      setActiveReward({ name: "Sir Hollin Thatch", type: "ally", description: "The Broken Knight has joined your cause." });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerEncounter = (node: Node) => {
    setActiveEncounter({
      name: "Marshal Scout",
      health: 2,
      threat: 1,
      description: "A metallic sentinel scouts the ash fields, eyes glowing with a cold, blue light."
    });
  };

  const handleEncounterResolve = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      const updates: any = {
        updatedAt: serverTimestamp()
      };

      if (progress.questProgress?.book1_quest_first_step?.status === "active") {
        const quest = progress.questProgress.book1_quest_first_step;
        if (!quest.steps.includes("survive_encounter")) {
          updates[`questProgress.book1_quest_first_step.steps`] = arrayUnion("survive_encounter");
        }
      }

      await updateDoc(doc(db, "playerProgress", user.uid), updates);
      setActiveEncounter(null);
      setActiveReward({ name: "10 Yellow Shards", type: "shards", value: 10 });
      await updateDoc(doc(db, "users", user.uid), { yellowShards: increment(10) });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const grantCard = async (cardId: string, source: string) => {
    if (!user) return;
    const acquiredAt = new Date();
    const tradeUnlock = new Date(acquiredAt.getTime() + (14 * 24 * 60 * 60 * 1000));
    const saleUnlock = new Date(acquiredAt.getTime() + (90 * 24 * 60 * 60 * 1000));

    await setDoc(doc(db, "users", user.uid, "playerCards", `${cardId}_${Date.now()}`), {
      cardId,
      acquiredAt,
      source,
      tradeUnlockDate: tradeUnlock,
      saleUnlockDate: saleUnlock,
      marketStatus: source === "starter_quest" ? "starter_sale_locked" : "active",
      tradeable: false,
      sellable: false
    });
  };

  if (!user && !loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="glass-panel p-12 text-center max-w-md rounded-3xl border-white/5 bg-zinc-950/40">
            <Compass className="w-16 h-16 text-amber-500/20 mx-auto mb-6" />
            <h2 className="text-3xl font-serif italic text-white mb-4">The Fog is Thick</h2>
            <p className="text-zinc-500 mb-8 italic">The Yellow Path only reveals itself to verified travelers. Please sign in to begin your campaign.</p>
            <Link href="/login" className="premium-button block w-full text-center">Sign In</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
      <p className="font-serif italic text-amber-500/60 animate-pulse text-xl">Consulting the Oracle...</p>
    </div>
  );

  return (
    <MainLayout>
      <div className="relative h-screen pt-20 overflow-hidden bg-obsidian">
        {/* Cinematic Map Environment */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUaHEhTgxR9amSf4Cf-0d4Ee-LUH9HBIXZ6EY8VKqu3V1tNGACgMKu-yINO3eIrSPwQ6EG82F9mG3BX5nKPcMxwcAYIhys1g7Xm9c36pJ-xz7UWMK0tjw5Swtg9vZFWkH3xOxTc-YIOpKANs8JGFHwlZTBf-RXziKi7GCtNHwDxRp41J9Dmm5n2gTV7HjLEZbBpJznVUUmqBoqHb94DHcJ_hfCGUIYA2acmJo4M5D7dzTWuaz44smEQtjX_uZVjjQVqALS0PqDUvcp"
            className="w-full h-full object-cover opacity-10 scale-110 blur-[1px]"
            alt="Map Atmosphere"
          />
          <div className="absolute inset-0 bg-radial-vignette opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
          
          {/* Ash Particles */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 2000, 
                  y: Math.random() * 1000, 
                  opacity: Math.random(), 
                  scale: Math.random() * 0.5 
                }}
                animate={{ 
                  y: [null, -100, -200], 
                  x: [null, i % 2 === 0 ? 50 : -50],
                  opacity: [0, 0.5, 0] 
                }}
                transition={{ 
                  duration: 5 + Math.random() * 10, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="absolute w-1 h-1 bg-zinc-400 rounded-full blur-[1px]"
              />
            ))}
          </div>

          {/* Interactive Light Aura */}
          <motion.div 
            className="absolute w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full"
            animate={{ 
              x: mousePos.x - 300, 
              y: mousePos.y - 300 
            }}
            transition={{ type: "spring", damping: 30, stiffness: 50, mass: 1 }}
          />
        </div>

        {/* Floating HUD Container */}
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-5xl px-6 flex justify-between items-start pointer-events-none">
          {/* AP Counter */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel px-10 py-4 rounded-full border-white/5 flex items-center gap-8 shadow-2xl bg-zinc-950/60 backdrop-blur-3xl pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              <div className="flex flex-col">
                <span className="text-[7px] uppercase font-bold tracking-[0.3em] text-zinc-500">Action Points</span>
                <div className="flex gap-2.5 mt-1">
                  {[1, 2, 3].map((p) => (
                    <motion.div 
                      key={p} 
                      animate={p <= (progress?.actionPoints || 0) ? { scale: [1, 1.2, 1], opacity: 1 } : { scale: 1, opacity: 0.2 }}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        p <= (progress?.actionPoints || 0) ? "bg-amber-500 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]" : "bg-transparent border-zinc-700"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {progress?.actionPoints === 0 && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleEndTurn}
                disabled={isProcessing}
                className="premium-button py-2.5 px-6 text-[9px] uppercase tracking-widest flex items-center gap-2 group"
              >
                <span>Rest the Path</span>
                <Timer className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" />
              </motion.button>
            )}
          </motion.div>

          {/* Quick Stats Panel */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel p-5 rounded-[2rem] border-white/5 bg-zinc-950/60 backdrop-blur-3xl pointer-events-auto space-y-4 min-w-[200px]"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Resilience</span>
                <span className="text-[10px] text-red-500 font-serif italic">{stats?.health || 0} / 10 HP</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <motion.div 
                  className="bg-gradient-to-r from-red-800 to-red-500 h-full rounded-full"
                  animate={{ width: `${(stats?.health || 0) * 10}%` }}
                  transition={{ type: "spring", bounce: 0, duration: 1 }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400"><Shield className="w-3.5 h-3.5" /></div>
                <div className="flex flex-col leading-none">
                   <span className="text-[7px] uppercase tracking-tighter text-zinc-500 font-bold">Steel</span>
                   <span className="text-xs text-white font-serif">{stats?.steel || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400"><Eye className="w-3.5 h-3.5" /></div>
                <div className="flex flex-col leading-none">
                   <span className="text-[7px] uppercase tracking-tighter text-zinc-500 font-bold">Mind</span>
                   <span className="text-xs text-white font-serif">{stats?.memory || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map Scroll Container */}
        <div 
          id="map-container"
          className="relative w-full h-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing p-40 scrollbar-hide select-none z-10"
        >
          <motion.div 
            drag="x"
            dragConstraints={{ left: -2000, right: 500 }}
            className="relative w-[3500px] h-full"
          >
            {/* SVG Path Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <filter id="nodeGlow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(245, 158, 11, 0)" />
                  <stop offset="50%" stopColor="rgba(245, 158, 11, 0.4)" />
                  <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
                </linearGradient>
              </defs>
              
              {BOOK_I_NODES.map((node) => 
                node.connectedNodes.map((targetId) => {
                  const target = BOOK_I_NODES.find(n => n.id === targetId);
                  if (!target) return null;
                  const isUnlocked = progress?.unlockedNodes.includes(node.id) && progress?.unlockedNodes.includes(targetId);
                  const isTraversed = progress?.visitedNodes.includes(node.id) && progress?.visitedNodes.includes(targetId);
                  
                  return (
                    <g key={`${node.id}-${targetId}`}>
                      <motion.line 
                        x1={`${node.x * 12}`} y1={`${node.y}%`}
                        x2={`${target.x * 12}`} y2={`${target.y}%`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        stroke={isTraversed ? "rgba(245, 158, 11, 0.4)" : isUnlocked ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.02)"}
                        strokeWidth={isTraversed ? "2.5" : isUnlocked ? "1.5" : "1"}
                        strokeDasharray={isTraversed ? "0" : isUnlocked ? "0" : "6,6"}
                        className="transition-all duration-1000"
                      />
                      {isTraversed && (
                         <motion.line 
                            x1={`${node.x * 12}`} y1={`${node.y}%`}
                            x2={`${target.x * 12}`} y2={`${target.y}%`}
                            stroke="url(#pathGradient)"
                            strokeWidth="4"
                            className="blur-[2px]"
                            animate={{ strokeDashoffset: [-20, 20] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                         />
                      )}
                    </g>
                  );
                })
              )}
            </svg>

            {/* Nodes Layer */}
            {BOOK_I_NODES.map((node) => {
              const isRevealed = progress?.revealedNodes.includes(node.id);
              if (!isRevealed) return null;

              const isUnlocked = progress?.unlockedNodes.includes(node.id);
              const isCurrent = progress?.currentNode === node.id;
              const isCompleted = progress?.completedNodes.includes(node.id);
              const isVisited = progress?.visitedNodes.includes(node.id);

              return (
                <motion.div
                  key={node.id}
                  className="absolute"
                  style={{ left: `${node.x * 12}px`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: node.x * 0.01 }}
                >
                  {/* Interactive Atmosphere */}
                  <AnimatePresence>
                    {isCurrent && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.8, opacity: [0.1, 0.25, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-amber-500 rounded-full blur-[40px]"
                      />
                    )}
                  </AnimatePresence>

                  <motion.button
                    onClick={() => handleNodeClick(node)}
                    whileHover={isUnlocked ? { scale: 1.2, zIndex: 50 } : {}}
                    whileTap={isUnlocked ? { scale: 0.9 } : {}}
                    className={cn(
                      "relative w-20 h-20 rounded-full border-[3px] flex items-center justify-center transition-all duration-700 group/node",
                      isCurrent ? "bg-amber-500 border-white/30 shadow-[0_0_40px_rgba(245,158,11,0.8)] z-20 scale-110" :
                      isCompleted ? "bg-zinc-950/80 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]" :
                      isUnlocked ? "bg-zinc-950/90 backdrop-blur-3xl border-zinc-700/50 hover:border-amber-500/50" : 
                      "bg-black/40 border-white/5 opacity-20 grayscale cursor-not-allowed"
                    )}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/node:opacity-100 transition-opacity" />
                    
                    {isCurrent ? <Navigation className="text-black w-10 h-10 fill-black" /> : 
                     node.type === "Search" || node.type === "EncounterSearch" ? <Search className={cn("w-7 h-7", isUnlocked ? "text-amber-500" : "text-zinc-700")} /> :
                     node.type === "Encounter" || node.type === "DangerPath" || node.type === "MiniBoss" || node.type === "FinalBoss" ? <Skull className={cn("w-7 h-7", isUnlocked ? "text-red-600" : "text-zinc-700")} /> :
                     node.type === "Story" || node.type === "StoryChoice" ? <Book className={cn("w-7 h-7", isUnlocked ? "text-blue-400" : "text-zinc-700")} /> :
                     node.type === "LockedDoor" ? <Lock className={cn("w-7 h-7", isUnlocked ? "text-zinc-400" : "text-zinc-700")} /> :
                     <div className={cn("w-4 h-4 rounded-full", isUnlocked ? "bg-amber-500/50" : "bg-zinc-800")} />}
                    
                    {/* Unvisited Glow */}
                    {isUnlocked && !isVisited && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 shadow-lg border border-white/30" />
                      </span>
                    )}

                    {/* Node Label Overlay */}
                    <div className="absolute top-full mt-8 left-1/2 -translate-x-1/2 w-56 text-center pointer-events-none transition-all duration-500 group-hover/node:mt-10">
                      <p className={cn(
                        "text-[9px] uppercase font-bold tracking-[0.4em] leading-tight transition-all duration-500",
                        isCurrent || isUnlocked ? "text-zinc-200 opacity-100" : "text-zinc-700 opacity-40"
                      )}>
                        {node.name}
                      </p>
                      {isVisited && !isCurrent && <span className="text-[7px] text-zinc-600 uppercase font-black mt-2 tracking-[0.3em] block">Explored</span>}
                    </div>
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Universal Map Controls */}
        <div className="fixed bottom-10 right-10 z-40 flex items-center gap-4">
           <button 
             onClick={centerOnCurrentNode}
             className="glass-panel p-5 rounded-full border-white/10 text-amber-500 hover:bg-amber-500/10 transition-all shadow-2xl group active:scale-95"
           >
             <Compass className="w-8 h-8 group-hover:rotate-[360deg] transition-transform duration-1000" />
           </button>
           <div className="glass-panel px-6 py-4 rounded-[2rem] border-white/10 text-zinc-500 font-serif italic text-sm flex items-center gap-3">
             <GripHorizontal className="w-4 h-4" />
             <span>Pan the Path</span>
           </div>
        </div>

        {/* CINEMATIC MODALS */}
        <AnimatePresence>
          {/* Node Interaction Panel */}
          {selectedNode && !activeEvent && !activeEncounter && !activeReward && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl"
            >
              <motion.div 
                layoutId={`node-panel-${selectedNode.id}`}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="w-full max-w-2xl glass-panel p-12 relative rounded-[3rem] border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] bg-zinc-950/80"
              >
                <div className="absolute top-10 right-10 flex gap-2">
                   <button onClick={() => setSelectedNode(null)} className="p-3 rounded-full hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
                      <ChevronRight className="rotate-180 w-6 h-6" />
                   </button>
                </div>

                <div className="mb-10 space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-[0.3em]">{selectedNode.type}</div>
                    <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
                  </div>
                  <h2 className="text-5xl text-white font-serif italic leading-tight">
                    {selectedNode.name}
                  </h2>
                </div>

                <div className="relative mb-12 p-8 rounded-[2rem] bg-black/40 border border-white/5 overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-red-900/5 opacity-40" />
                  <p className="relative z-10 text-zinc-400 italic leading-relaxed text-xl font-serif">
                    "{selectedNode.description}"
                  </p>
                  <Flame className="absolute -bottom-6 -right-6 w-32 h-32 text-amber-500/5 group-hover:text-amber-500/10 transition-colors" />
                </div>

                {selectedNode.requirements && (
                  <div className="mb-12 p-8 glass-panel bg-amber-500/5 border-amber-500/20 rounded-[2rem]">
                    <h4 className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Lock className="w-4 h-4" /> Requirement Check
                    </h4>
                    <div className="space-y-5">
                      {selectedNode.requirements.key && (
                        <div className={cn("flex justify-between items-center p-4 rounded-xl border transition-all", progress.inventoryKeys.includes(selectedNode.requirements.key) ? "border-amber-500/30 bg-amber-500/5 text-amber-500" : "border-white/5 bg-white/2 text-zinc-600")}>
                          <span className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest"><Key className="w-5 h-5" /> {selectedNode.requirements.key}</span>
                          {progress.inventoryKeys.includes(selectedNode.requirements.key) ? <CheckCircle2 className="w-5 h-5 shadow-glow" /> : <Lock className="w-5 h-5" />}
                        </div>
                      )}
                      {selectedNode.requirements.stat && (
                        <div className={cn("flex justify-between items-center p-4 rounded-xl border transition-all", stats[selectedNode.requirements.stat.name] >= selectedNode.requirements.stat.value ? "border-amber-500/30 bg-amber-500/5 text-amber-500" : "border-white/5 bg-white/2 text-zinc-600")}>
                          <span className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest"><Sparkles className="w-5 h-5" /> {selectedNode.requirements.stat.name} {selectedNode.requirements.stat.value}+</span>
                          {stats[selectedNode.requirements.stat.name] >= selectedNode.requirements.stat.value ? <CheckCircle2 className="w-5 h-5 shadow-glow" /> : <Lock className="w-5 h-5" />}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-6">
                  {progress?.unlockedNodes.includes(selectedNode.id) && progress?.currentNode !== selectedNode.id ? (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMove(selectedNode)}
                      disabled={progress.actionPoints < 1 || isProcessing || !checkRequirements(selectedNode)}
                      className="flex-1 premium-button py-6 text-lg flex items-center justify-center gap-4 shadow-xl disabled:grayscale disabled:opacity-30"
                    >
                      <Navigation className="w-6 h-6" /> Step onto Path
                    </motion.button>
                  ) : progress?.currentNode === selectedNode.id && (selectedNode.type === "Search" || selectedNode.type === "EncounterSearch") ? (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSearch(selectedNode)}
                      disabled={progress.actionPoints < 1 || isProcessing}
                      className="flex-1 premium-button py-6 text-lg flex items-center justify-center gap-4 bg-gradient-to-r from-red-900 to-amber-800 border-none shadow-[0_0_30px_rgba(139,17,17,0.4)]"
                    >
                      <Search className="w-6 h-6" /> Scour the Ruins
                    </motion.button>
                  ) : progress?.currentNode === selectedNode.id ? (
                    <div className="flex-1 glass-panel border-amber-500/30 bg-amber-500/10 py-6 text-center rounded-2xl flex items-center justify-center gap-4 text-amber-500">
                      <MapPin className="w-6 h-6 animate-bounce" />
                      <span className="font-bold uppercase tracking-[0.3em] text-sm">Present Location</span>
                    </div>
                  ) : (
                    <div className="flex-1 glass-panel border-white/5 py-6 text-center rounded-2xl flex items-center justify-center gap-4 opacity-40 grayscale">
                      <Lock className="w-6 h-6" />
                      <span className="font-bold uppercase tracking-[0.3em] text-sm">Path Obscured</span>
                    </div>
                  )}
                  <button onClick={() => setSelectedNode(null)} className="px-10 py-6 glass-panel border-white/10 hover:bg-white/5 text-[10px] uppercase font-bold tracking-[0.2em] rounded-2xl transition-all">Back</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Story Event - Full Narrative Immersion */}
          {activeEvent && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-4xl glass-panel p-16 text-center space-y-12 border-white/10 rounded-[4rem] bg-zinc-950/80 shadow-[0_0_150px_rgba(0,0,0,1)]">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600/20 to-zinc-950 border border-blue-500/30 flex items-center justify-center mx-auto relative z-10 shadow-2xl">
                    <Book className="w-10 h-10 text-blue-400" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px w-10 bg-blue-500/30" />
                    <span className="text-[10px] uppercase tracking-[0.5em] text-blue-500 font-black">Story Progression</span>
                    <div className="h-px w-10 bg-blue-500/30" />
                  </div>
                  <h2 className="text-6xl text-white font-serif italic">{activeEvent.title}</h2>
                  <p className="text-2xl text-zinc-400 italic leading-relaxed max-w-2xl mx-auto font-serif">"{activeEvent.description}"</p>
                </div>
                <div className="grid grid-cols-1 gap-6 pt-10">
                  {activeEvent.choices.map((choice: any) => (
                    <motion.button
                      key={choice.id}
                      whileHover={choice.canDo ? { x: 15, scale: 1.01 } : {}}
                      disabled={!choice.canDo || isProcessing}
                      onClick={() => handleEventChoice(choice)}
                      className={cn(
                        "p-8 border rounded-[2.5rem] flex justify-between items-center transition-all group relative overflow-hidden",
                        choice.canDo ? "border-white/10 hover:border-blue-500/50 bg-black/40" : "border-white/5 opacity-30 grayscale cursor-not-allowed"
                      )}
                    >
                      {choice.canDo && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
                      <div className="text-left relative z-10">
                        <p className="text-white font-serif italic text-3xl group-hover:text-blue-400 transition-colors">{choice.label}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="p-1 rounded bg-blue-500/10 text-blue-400"><Sparkles className="w-3 h-3" /></div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{choice.result}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 relative z-10">
                        <span className="text-[9px] uppercase font-black tracking-[0.2em] text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 shadow-inner">{choice.req}</span>
                        {choice.canDo ? <Zap className="w-6 h-6 text-blue-500 fill-blue-500/20 animate-pulse" /> : <Lock className="w-6 h-6 text-zinc-700" />}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Encounter - Battle Tension */}
          {activeEncounter && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="w-full max-w-2xl glass-panel p-16 text-center space-y-12 border-red-900/40 rounded-[4rem] bg-zinc-950/80 shadow-[0_0_200px_rgba(139,17,17,0.4)]"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-600/10 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-900/40 to-black border-2 border-red-600/30 flex items-center justify-center mx-auto relative z-10 shadow-2xl">
                     <Skull className="w-14 h-14 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    <span className="text-red-600 text-[10px] uppercase font-black tracking-[0.5em]">High Danger Zone</span>
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  </div>
                  <h2 className="text-6xl text-white font-serif italic">The {activeEncounter.name} Attacks</h2>
                  <p className="text-xl text-zinc-400 italic leading-relaxed font-serif">"{activeEncounter.description}"</p>
                </div>
                
                <div className="p-10 rounded-[2.5rem] bg-black/60 border border-white/5 space-y-6 shadow-inner">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-sm bg-red-600 rotate-45" />
                       <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">Threat Level</span>
                    </div>
                    <span className="text-red-500 font-serif italic text-3xl">{activeEncounter.health} Essence</span>
                  </div>
                  <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-red-950 via-red-600 to-red-400 rounded-full shadow-[0_0_20px_rgba(139,17,17,0.8)]" 
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(139, 17, 17, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEncounterResolve}
                  disabled={isProcessing}
                  className="w-full premium-button h-24 text-3xl flex items-center justify-center gap-6 bg-gradient-to-r from-red-950 to-red-700 border-none group"
                >
                  <Sword className="w-10 h-10 group-hover:rotate-12 transition-transform" /> 
                  <span>Exterminate Threat</span>
                </motion.button>
              </motion.div>
            </div>
          )}

          {/* Reward Modal - Cinematic Loot Reveal */}
          {activeReward && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl">
              <motion.div 
                initial={{ y: 100, opacity: 0, scale: 0.8 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }}
                className="w-full max-w-xl glass-panel p-20 text-center space-y-10 border-amber-500/30 rounded-[4rem] bg-zinc-950/80 shadow-[0_0_200px_rgba(245,158,11,0.2)]"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/20 blur-[80px] rounded-full scale-150" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-40px] border-2 border-dashed border-amber-500/20 rounded-full"
                  />
                  <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-amber-600/30 to-zinc-950 border border-amber-500/40 flex items-center justify-center mx-auto relative z-10 shadow-3xl">
                     <CheckCircle2 className="w-16 h-16 text-amber-500 drop-shadow-glow" />
                  </div>
                </div>
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-black tracking-[0.6em] text-amber-500 block">Tribute Reclaimed</span>
                  <h3 className="text-5xl text-white font-serif italic leading-tight">{activeReward.name}</h3>
                  <div className="h-px w-20 bg-amber-500/30 mx-auto my-6" />
                  <p className="text-xl text-zinc-400 italic leading-relaxed font-serif max-w-sm mx-auto">
                    "{activeReward.description || `The path rewards those who dare to walk its scorched length.`}"
                  </p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveReward(null)}
                  className="w-full premium-button py-6 text-xl shadow-[0_20px_50px_rgba(245,158,11,0.1)]"
                >
                  Confirm and Advance
                </motion.button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <BetaNotice />
      </div>
    </MainLayout>
  );
}

function getSearchPool(nodeId: string) {
  if (nodeId === "book1_node_003") return [
    { id: "rust-key", name: "Rust Key", type: "key", description: "A jagged, orange-stained key that smells of wet metal." },
    { id: "broken-dagger", name: "Broken Dagger", type: "card", description: "Its blade is shattered, but the silver hilt still glows with ancient power." },
    { id: "fragment", name: "Map Fragment", type: "fragment", description: "A piece of scorched parchment showing a hidden trail." }
  ];
  return [{ id: "shards", name: "5 Yellow Shards", type: "shards", value: 5, description: "Crystalline shards that hum with the energy of the Yellow Brick." }];
}


