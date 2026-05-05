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
  Sword,
  Trophy,
  Navigation,
  Compass,
  CheckCircle2,
  AlertCircle,
  Book,
  Sparkles,
  Backpack,
  Flame,
  GripHorizontal,
  Star,
  X,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, updateDoc, getDoc, arrayUnion, onSnapshot, serverTimestamp, setDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BetaNotice } from "@/components/shared/BetaNotice";
import Link from "next/link";
import { ENEMIES, BOSSES, Enemy } from "@/constants/encounters";

export default function CampaignBoard() {
  const { user, profile } = useAuth();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [activeEncounter, setActiveEncounter] = useState<any>(null);
  const [activeReward, setActiveReward] = useState<any>(null);
  const [questComplete, setQuestComplete] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success' | 'error' | 'info'}[]>([]);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

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
      addToast(`Moved to ${node.name}`, 'success');

      if (node.type === "FinalBoss") {
        triggerBoss(node);
      } else if (node.eventId && !progress.completedNodes.includes(node.eventId)) {
        triggerStoryEvent(node.eventId);
      } else if (node.type === "Encounter" || node.type === "DangerPath" || node.type === "EncounterSearch" || node.type === "MiniBoss") {
        triggerEncounter(node);
      }

    } catch (err) {
      console.error(err);
      addToast("Failed to move. Try again.", 'error');
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
      addToast(`Found: ${result.name}`, 'success');
    } catch (err) {
      console.error(err);
      addToast("Search failed.", 'error');
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
            result: "Unlock Sir Hollin Thatch ally, +1 Courage",
            success: "You drive them back. Thatch is free.",
            failure: "The mob is too strong. You are forced to retreat."
          },
          { 
            id: "c2", 
            label: "Sneak Around the Gallows", 
            req: "Memory 2", 
            canDo: stats.memory >= 2,
            result: "Unlock Sir Hollin Thatch ally",
            success: "Shadows are your friends. Thatch is free.",
            failure: "A rusted gear squeaks. You are spotted."
          },
          { 
            id: "c3", 
            label: "Call for Mercy", 
            req: "Hope 3", 
            canDo: stats.hope >= 3,
            result: "Unlock Sir Hollin Thatch ally, +1 Hope",
            success: "Your words resonate. Even tin hearts soften.",
            failure: "Mercy is a foreign concept to these constructs."
          }
        ]
      });
    } else if (eventId === "book1_story_living_arches") {
      setActiveEvent({
        id: eventId,
        title: "Beneath the Living Arches",
        description: "Bio-mechanical flora weaves a canopy of brass leaves and pulsing vines. The air smells of ozone and nectar.",
        choices: [
          { id: "c1", label: "Commune with the Core", req: "Memory 4", canDo: stats.memory >= 4, result: "+1 Memory, Reveal Hidden Search", success: "You understand the code. The forest speaks.", failure: "The static is deafening." },
          { id: "c2", label: "Harvest Spare Parts", req: "Steel 3", canDo: stats.steel >= 3, result: "+20 Yellow Shards", success: "You take what you need from the metal stalks.", failure: "The vines lash out." }
        ]
      });
    } else if (eventId === "book1_story_memory_of_kansas") {
      setActiveEvent({
        id: eventId,
        title: "Memory of Kansas",
        description: "The dust forms a familiar shape—a house, a dog, a voice calling your name from the cellar.",
        choices: [
          { id: "c1", label: "Embrace the Vision", req: "Hope 5", canDo: stats.hope >= 5, result: "+2 Hope, -1 Resilience", success: "The warmth is real, for a moment.", failure: "It's just ash in the wind." },
          { id: "c2", label: "Deny the Mirage", req: "Steel 4", canDo: stats.steel >= 4, result: "+2 Steel", success: "Oz is the only reality now.", failure: "Doubt creeps in." }
        ]
      });
    } else if (eventId === "book1_story_siege_begins") {
      setActiveEvent({
        id: eventId,
        title: "The Siege Begins",
        description: "Rebel forces gather at the Iron Maw. The sky is black with the smoke of the forges.",
        choices: [
          { id: "c1", label: "Lead the Vanguard", req: "Courage 6", canDo: stats.courage >= 6, result: "+2 Courage, +50 Shards", success: "You are the spearhead of the revolution.", failure: "The wall is too high." },
          { id: "c2", label: "Support the Artillery", req: "Steel 5", canDo: stats.steel >= 5, result: "+1 Steel, +30 Shards", success: "Steel meets steel. The gates buckle.", failure: "A miscalculation cost you dearly." }
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
    const pool = Object.values(ENEMIES);
    // Logic to select enemy based on section or type
    let enemy = pool[Math.floor(Math.random() * pool.length)];
    
    if (node.type === "MiniBoss") {
      enemy = ENEMIES["clockwork_sentinel"];
    } else if (node.section === 1) {
      enemy = ENEMIES["marshal_scout"];
    }

    setActiveEncounter(enemy);
  };

  const triggerBoss = (node: Node) => {
    setActiveEncounter({ ...BOSSES["marshal_argent"], isBoss: true });
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
      
      // Check if quest just completed
      if (progress.questProgress?.book1_quest_first_step?.status === "active") {
        const quest = progress.questProgress.book1_quest_first_step;
        const currentSteps = [...quest.steps];
        if (!currentSteps.includes("survive_encounter")) currentSteps.push("survive_encounter");
        
        if (currentSteps.includes("scour_area") && currentSteps.includes("rescue_thatch") && currentSteps.includes("survive_encounter")) {
          setQuestComplete({
            title: "First Step Complete",
            description: "You have survived the initial horrors of the Red Country and secured a key ally. The path ahead is long, but you are no longer alone.",
            rewardName: "Sir Hollin Thatch (Founder Edition)"
          });
          // Note: Logic to update quest status to 'completed' and grant the card would go here, 
          // but I'm keeping it to UI/Display triggers as requested.
        }
      }

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

        {/* Cinematic Header HUD */}
        <div className="fixed top-24 inset-x-0 z-40 px-6 max-w-7xl mx-auto pointer-events-none">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Campaign Context */}
            <motion.div 
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="glass-panel p-6 rounded-[2rem] border-primary/20 bg-black/80 backdrop-blur-2xl pointer-events-auto min-w-[320px] shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Book className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-zinc-500 text-[9px] uppercase tracking-[0.4em] font-black leading-tight">Book I: Blood on the Yellow Brick</h1>
                  <h2 className="text-white text-xl font-serif italic tracking-tight">Campaign: Red Country</h2>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-zinc-500 text-[8px] uppercase tracking-widest font-bold">Current Objective</span>
                  <span className="text-primary text-[10px] font-serif italic">Find the Rebel Trail</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((progress?.completedNodes?.length || 0) / BOOK_I_NODES.length) * 100}%` }}
                    className="bg-primary h-full shadow-[0_0_10px_rgba(200,155,44,0.6)]"
                  />
                </div>
                <div className="flex justify-between items-center text-[7px] text-zinc-600 uppercase font-black tracking-widest pt-1">
                  <span>Progress</span>
                  <span>{Math.round(((progress?.completedNodes?.length || 0) / BOOK_I_NODES.length) * 100)}% Complete</span>
                </div>
              </div>
            </motion.div>

            {/* Main Stats HUD */}
            <motion.div 
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-wrap items-center gap-3 pointer-events-auto"
            >
              {/* AP Counter Pill */}
              <div className="glass-panel px-6 py-3 rounded-full border-primary/20 bg-black/80 flex items-center gap-4 shadow-xl group relative">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary fill-primary/20" />
                  <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400">AP</span>
                </div>
                
                {/* AP Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 w-48 z-[60]">
                   <div className="glass-panel p-4 rounded-2xl border-white/10 bg-black/90 backdrop-blur-3xl text-center space-y-2 shadow-2xl">
                      <p className="text-[8px] uppercase tracking-widest text-primary font-black">Action Points</p>
                      <p className="text-[10px] text-zinc-400 font-serif italic leading-relaxed">AP is spent to move, search, and interact. End your turn to refresh AP.</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black/90" />
                   </div>
                </div>

                <div className="flex gap-2">
                  {[1, 2, 3].map((p) => (
                    <motion.div 
                      key={p} 
                      animate={p <= (progress?.actionPoints || 0) ? { scale: [1, 1.2, 1], opacity: 1 } : { scale: 1, opacity: 0.2 }}
                      className={cn(
                        "w-4 h-4 rounded-full border-2 transition-all",
                        p <= (progress?.actionPoints || 0) ? "bg-primary border-primary-accent shadow-[0_0_10px_rgba(200,155,44,0.6)]" : "bg-transparent border-zinc-700"
                      )}
                    />
                  ))}
                </div>
                {progress?.actionPoints === 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handleEndTurn}
                    disabled={isProcessing}
                    className="ml-2 px-4 py-1.5 bg-primary/20 hover:bg-primary/40 border border-primary/30 rounded-full text-[8px] uppercase tracking-widest text-primary font-black transition-all flex items-center gap-2"
                  >
                    <span>Rest</span>
                    <Timer className="w-3 h-3" />
                  </motion.button>
                )}
              </div>

              {/* Map Legend Toggle */}
              <button 
                onClick={() => setIsLegendOpen(true)}
                className="glass-panel p-3 rounded-full border-primary/20 bg-black/80 text-primary hover:bg-primary/10 transition-all shadow-xl"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Shards Pill */}
              <div className="glass-panel px-5 py-3 rounded-full border-primary/20 bg-black/80 flex items-center gap-3 shadow-xl">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-lg font-serif italic text-white leading-none">{profile?.yellowShards || 0}</span>
                <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-bold">Shards</span>
              </div>

              {/* Node Status Pill */}
              <div className="hidden lg:flex glass-panel px-6 py-3 rounded-full border-primary/20 bg-black/80 items-center gap-4 shadow-xl">
                <MapPin className="w-4 h-4 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-[7px] uppercase font-bold tracking-widest text-zinc-500">Currently At</span>
                  <span className="text-xs text-white font-serif italic truncate max-w-[120px]">
                    {BOOK_I_NODES.find(n => n.id === progress?.currentNode)?.name || "The Void"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stat Cards - Secondary HUD Row */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: <Heart className="w-3 h-3" />, label: "Resilience", value: `${stats?.health || 0}/10`, color: "text-red-500", bg: "bg-red-500/10" },
              { icon: <Shield className="w-3 h-3" />, label: "Steel", value: stats?.steel || 0, color: "text-zinc-300", bg: "bg-zinc-500/10" },
              { icon: <Compass className="w-3 h-3" />, label: "Courage", value: stats?.courage || 0, color: "text-amber-500", bg: "bg-amber-500/10" },
              { icon: <Star className="w-3 h-3" />, label: "Hope", value: stats?.hope || 0, color: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: <Eye className="w-3 h-3" />, label: "Memory", value: stats?.memory || 0, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.05) }}
                className="glass-panel px-4 py-2.5 rounded-2xl border-white/5 bg-black/60 pointer-events-auto flex items-center gap-3 shadow-lg"
              >
                <div className={cn("p-1.5 rounded-lg", stat.bg, stat.color)}>
                  {stat.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] uppercase tracking-tighter text-zinc-500 font-bold">{stat.label}</span>
                  <span className={cn("text-xs font-serif italic font-bold", stat.color)}>{stat.value}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Map Scroll Container */}
        <div 
          id="map-container"
          className="relative w-full h-full overflow-auto cursor-grab active:cursor-grabbing p-20 md:p-40 scrollbar-hide select-none z-10"
        >
          <motion.div 
            drag
            dragConstraints={{ left: -2500, right: 500, top: -500, bottom: 500 }}
            className="relative w-[3500px] h-[1500px]"
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
              const isBoss = node.type.includes("Boss");

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
                        animate={{ scale: 2.2, opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-primary rounded-full blur-[50px]"
                      />
                    )}
                    {isBoss && isUnlocked && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 2.5, opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-secondary rounded-full blur-[60px]"
                      />
                    )}
                  </AnimatePresence>

                  <motion.button
                    onClick={() => handleNodeClick(node)}
                    whileHover={isUnlocked ? { scale: 1.25, zIndex: 50 } : {}}
                    whileTap={isUnlocked ? { scale: 0.9 } : {}}
                    className={cn(
                      "relative w-24 h-24 rounded-full border-[3px] flex items-center justify-center transition-all duration-700 group/node",
                      isCurrent ? "bg-primary border-white/40 shadow-[0_0_60px_rgba(200,155,44,0.8)] z-20 scale-110" :
                      isBoss && isUnlocked ? "bg-black/90 border-secondary shadow-[0_0_40px_rgba(139,17,17,0.6)]" :
                      isCompleted ? "bg-zinc-950/80 border-primary/40 shadow-[0_0_20px_rgba(200,155,44,0.1)]" :
                      isUnlocked ? "bg-zinc-950/90 backdrop-blur-3xl border-zinc-700/50 hover:border-primary/50" : 
                      "bg-black/60 border-white/5 opacity-30 grayscale cursor-not-allowed"
                    )}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/node:opacity-100 transition-opacity" />
                    
                    {isCurrent ? <Navigation className="text-black w-10 h-10 fill-black" /> : 
                     isCompleted ? <CheckCircle2 className="w-8 h-8 text-primary shadow-glow" /> :
                     node.type === "Search" || node.type === "EncounterSearch" ? <Search className={cn("w-8 h-8", isUnlocked ? "text-primary" : "text-zinc-700")} /> :
                     isBoss || node.type === "Encounter" || node.type === "DangerPath" ? <Skull className={cn("w-8 h-8", isUnlocked ? "text-secondary" : "text-zinc-700")} /> :
                     node.type === "Story" || node.type === "StoryChoice" ? <Book className={cn("w-8 h-8", isUnlocked ? "text-blue-400" : "text-zinc-700")} /> :
                     node.type === "LockedDoor" ? <Lock className={cn("w-8 h-8", isUnlocked ? "text-zinc-400" : "text-zinc-700")} /> :
                     <div className={cn("w-5 h-5 rounded-full", isUnlocked ? "bg-primary/50" : "bg-zinc-800")} />}
                    
                    {/* Unvisited Glow */}
                    {isUnlocked && !isVisited && !isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-primary shadow-lg border border-white/30" />
                      </span>
                    )}

                    {/* Node Label Overlay */}
                    <div className="absolute top-full mt-10 left-1/2 -translate-x-1/2 w-64 text-center pointer-events-none transition-all duration-500 group-hover/node:mt-12">
                      <p className={cn(
                        "text-[10px] uppercase font-black tracking-[0.5em] leading-tight transition-all duration-500",
                        isCurrent || isUnlocked ? "text-zinc-100 opacity-100 drop-shadow-lg" : "text-zinc-700 opacity-40"
                      )}>
                        {node.name}
                      </p>
                      {isVisited && !isCurrent && <span className="text-[8px] text-primary/40 uppercase font-black mt-3 tracking-[0.4em] block">Legacy Forged</span>}
                    </div>
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Map Legend */}
        <div className="fixed bottom-32 left-10 z-40 hidden md:block">
           <div className={cn(
             "glass-panel transition-all duration-500 overflow-hidden bg-black/80 backdrop-blur-3xl border-white/5",
             isLegendOpen ? "w-64 p-6 rounded-[2rem]" : "w-14 h-14 p-0 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5"
           )} onClick={() => !isLegendOpen && setIsLegendOpen(true)}>
              {isLegendOpen ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Map Legend</span>
                    <button onClick={(e) => { e.stopPropagation(); setIsLegendOpen(false); }} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: <MapPin className="w-3 h-3 text-primary" />, label: "Current Node" },
                      { icon: <CheckCircle2 className="w-3 h-3 text-primary" />, label: "Completed" },
                      { icon: <div className="w-3 h-3 rounded-full border border-primary/40 bg-primary/20" />, label: "Available" },
                      { icon: <Lock className="w-3 h-3 text-zinc-600" />, label: "Locked" },
                      { icon: <Skull className="w-3 h-3 text-red-600" />, label: "Boss / Danger" },
                      { icon: <Search className="w-3 h-3 text-amber-500" />, label: "Searchable" },
                      { icon: <Book className="w-3 h-3 text-blue-400" />, label: "Story Event" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">{item.icon}</div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-tighter font-bold">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Info className="w-6 h-6 text-zinc-500" />
              )}
           </div>
        </div>

        {/* Universal Map Controls */}
        <div className="fixed bottom-10 right-10 z-40 flex items-center gap-4">
           <motion.button 
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={centerOnCurrentNode}
             className="glass-panel p-5 rounded-full border-primary/20 text-primary hover:bg-primary/10 transition-all shadow-2xl group"
           >
             <Compass className="w-8 h-8 group-hover:rotate-[360deg] transition-transform duration-1000" />
           </motion.button>
           <div className="hidden sm:flex glass-panel px-6 py-4 rounded-[2rem] border-white/10 text-zinc-500 font-serif italic text-sm items-center gap-3 bg-black/60 backdrop-blur-xl">
             <GripHorizontal className="w-4 h-4" />
             <span>Pan to Navigate</span>
           </div>
        </div>

        {/* CINEMATIC MODALS */}
        <AnimatePresence>
          {/* Node Interaction Panel - Responsive Modal/Bottom Sheet */}
          {selectedNode && !activeEvent && !activeEncounter && !activeReward && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl" onClick={() => setSelectedNode(null)}>
              <div className="min-h-full flex items-end md:items-center justify-center p-0 md:p-6">
                <motion.div 
                  initial={{ y: "100%", scale: 0.95 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ y: "100%", scale: 0.95 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="w-full max-w-2xl glass-panel p-8 md:p-12 relative rounded-t-[2.5rem] md:rounded-[3rem] border-primary/20 shadow-[0_-20px_100px_rgba(0,0,0,1)] bg-[#0a0a0a]/95 pointer-events-auto overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                <Compass className="absolute -top-12 -right-12 w-64 h-64 text-primary/5 rotate-12 pointer-events-none" />

                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-[0.3em] border shadow-inner",
                        selectedNode.type.includes("Boss") ? "bg-red-500/10 border-red-500/30 text-red-500" :
                        selectedNode.type === "Search" ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                        "bg-primary/10 border-primary/30 text-primary"
                      )}>
                        {selectedNode.type}
                      </div>
                      <div className="h-px w-8 bg-white/10" />
                      <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Section {selectedNode.section}</span>
                    </div>
                    <h2 className={cn(
                      "text-4xl md:text-5xl text-white font-serif italic tracking-tight leading-tight",
                      selectedNode.type.includes("Boss") && "gold-gradient-text"
                    )}>
                      {selectedNode.name}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="p-3 rounded-full hover:bg-white/5 text-zinc-600 hover:text-white transition-all border border-white/5"
                  >
                    <ChevronRight className="rotate-90 w-5 h-5" />
                  </button>
                </div>

                {/* Description Box */}
                <div className="relative mb-10 p-8 rounded-3xl bg-black/40 border border-white/5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-40" />
                  <p className="relative z-10 text-zinc-400 italic leading-relaxed text-xl font-serif">
                    "{selectedNode.description}"
                  </p>
                </div>

                {/* Requirements / Status Checklist */}
                <div className="mb-10 space-y-6">
                  {/* Status Banner */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border",
                      progress?.currentNode === selectedNode.id ? "bg-primary/10 border-primary/30 text-primary" :
                      progress?.completedNodes.includes(selectedNode.id) ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                      progress?.unlockedNodes.includes(selectedNode.id) ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                      "bg-zinc-900 border-white/5 text-zinc-600"
                    )}>
                      {progress?.currentNode === selectedNode.id ? <Navigation className="w-5 h-5" /> :
                       progress?.completedNodes.includes(selectedNode.id) ? <CheckCircle2 className="w-5 h-5" /> :
                       progress?.unlockedNodes.includes(selectedNode.id) ? <Compass className="w-5 h-5" /> :
                       <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-black tracking-widest text-zinc-500">Node Status</p>
                      <p className="text-sm text-zinc-200 font-serif italic">
                        {progress?.currentNode === selectedNode.id ? "Presently Occupying" :
                         progress?.completedNodes.includes(selectedNode.id) ? "Chronicle Recorded" :
                         progress?.unlockedNodes.includes(selectedNode.id) ? "Path Visible" :
                         "Obscured by Mist"}
                      </p>
                    </div>
                  </div>

                  {/* Locked State Checklist */}
                  {selectedNode.requirements && (
                    <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-white/5 space-y-6">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.4em] flex items-center gap-2">
                           <Lock className="w-3 h-3" /> Entry Requirements
                         </h4>
                         {!checkRequirements(selectedNode) && (
                           <span className="text-[8px] text-amber-500/60 uppercase font-black animate-pulse">Required Artifacts Missing</span>
                         )}
                      </div>
                      
                      <div className="space-y-3">
                        {selectedNode.requirements.key && (
                          <div className={cn(
                            "flex justify-between items-center p-5 rounded-xl border transition-all",
                            progress.inventoryKeys.includes(selectedNode.requirements.key) ? "bg-primary/5 border-primary/20 text-primary" : "bg-white/[0.02] border-white/5 text-zinc-600"
                          )}>
                            <div className="flex items-center gap-4">
                              <Key className="w-4 h-4" />
                              <span className="text-[11px] uppercase font-black tracking-widest">{selectedNode.requirements.key.replace("-", " ")}</span>
                            </div>
                            {progress.inventoryKeys.includes(selectedNode.requirements.key) ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                        )}
                        {selectedNode.requirements.stat && (
                          <div className={cn(
                            "flex justify-between items-center p-5 rounded-xl border transition-all",
                            stats[selectedNode.requirements.stat.name] >= selectedNode.requirements.stat.value ? "bg-blue-500/5 border-blue-500/20 text-blue-400" : "bg-white/[0.02] border-white/5 text-zinc-600"
                          )}>
                            <div className="flex items-center gap-4">
                              <Sparkles className="w-4 h-4" />
                              <span className="text-[11px] uppercase font-black tracking-widest">{selectedNode.requirements.stat.name} {selectedNode.requirements.stat.value}+</span>
                            </div>
                            {stats[selectedNode.requirements.stat.name] >= selectedNode.requirements.stat.value ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                        )}
                      </div>

                      {/* Suggested Next Step */}
                      {!checkRequirements(selectedNode) && (
                        <div className="pt-4 border-t border-white/5">
                           <p className="text-[8px] uppercase font-black tracking-widest text-zinc-600 mb-2">Suggested Next Step</p>
                           <p className="text-[10px] text-zinc-400 font-serif italic">
                             {selectedNode.requirements.key === "rust-key" ? "Scour the Farmhouse Ruins or Ash Field for a rusted relic." :
                              selectedNode.requirements.key === "steel-gate-key" ? "Seek audience with the rebels to obtain the City of Steel clearance." :
                              "Consult your map for other trails to increase your stats or find hidden keys."}
                           </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {progress?.currentNode === selectedNode.id ? (
                    <>
                      {(selectedNode.type === "Search" || selectedNode.type === "EncounterSearch" || selectedNode.type === "HiddenSearch") && (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSearch(selectedNode)}
                          disabled={progress.actionPoints < 1 || isProcessing}
                          className="premium-button premium-button-gold py-6 text-xl flex items-center justify-center gap-4 rounded-2xl disabled:opacity-30"
                        >
                          <Search className="w-6 h-6" /> 
                          <div className="text-left">
                            <p className="leading-none mb-1">Search Area</p>
                            <p className="text-[8px] uppercase tracking-widest opacity-60">Cost: 1 AP</p>
                          </div>
                        </motion.button>
                      )}
                      {selectedNode.eventId && !progress.completedNodes.includes(selectedNode.eventId) && (
                         <motion.button 
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => triggerStoryEvent(selectedNode.eventId!)}
                           className="premium-button py-6 text-xl flex items-center justify-center gap-4 rounded-2xl"
                         >
                           <Book className="w-6 h-6" />
                           <div className="text-left">
                             <p className="leading-none mb-1">Begin Event</p>
                             <p className="text-[8px] uppercase tracking-widest opacity-60">Story Unfolds</p>
                           </div>
                         </motion.button>
                      )}
                      <div className="flex items-center justify-center p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-zinc-600 font-serif italic text-sm italic col-span-full">
                         You are currently here.
                      </div>
                    </>
                  ) : progress?.unlockedNodes.includes(selectedNode.id) ? (
                    <motion.button 
                      whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(200,155,44,0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMove(selectedNode)}
                      disabled={progress.actionPoints < 1 || isProcessing || !checkRequirements(selectedNode)}
                      className="col-span-full premium-button premium-button-gold py-8 text-2xl flex items-center justify-center gap-5 disabled:grayscale disabled:opacity-30 rounded-3xl"
                    >
                      <Navigation className="w-8 h-8" /> 
                      <div className="text-left">
                        <p className="leading-none mb-1">Step into the Night</p>
                        <p className="text-[9px] uppercase tracking-[0.2em] opacity-60">Travel Cost: 1 AP</p>
                      </div>
                    </motion.button>
                  ) : (
                    <div className="col-span-full glass-panel border-white/5 py-8 text-center rounded-3xl flex items-center justify-center gap-5 opacity-40 grayscale">
                      <Lock className="w-8 h-8" />
                      <span className="font-black uppercase tracking-[0.4em] text-lg">Path Obscured</span>
                    </div>
                  )}
                  
                  {/* Cancel Button */}
                  {progress?.unlockedNodes.includes(selectedNode.id) && (
                    <button 
                      onClick={() => setSelectedNode(null)}
                      className="col-span-full py-4 text-[9px] text-zinc-600 hover:text-white uppercase font-black tracking-widest transition-all"
                    >
                      Dismiss View
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
          )}


          {/* Story Event - Narrative Immersion */}
          {activeEvent && (
            <div className="fixed inset-0 z-[60] bg-black/98 backdrop-blur-3xl overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-4 md:p-12">
                <motion.div 
                  initial={{ y: 50, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  className="w-full max-w-4xl glass-panel p-8 md:p-20 text-center space-y-12 border-primary/30 rounded-[3rem] md:rounded-[4rem] bg-zinc-950/90 shadow-[0_0_150px_rgba(0,0,0,1)] relative overflow-hidden"
                >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <Book className="absolute -top-10 -right-10 w-48 h-48 text-primary/5 -rotate-12 pointer-events-none" />

                <div className="space-y-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border border-primary/30 flex items-center justify-center shadow-2xl relative">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                      <Book className="w-8 h-8 text-primary relative z-10" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.6em] text-primary font-black">Interactive Chronicle</span>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-5xl md:text-7xl text-white font-serif italic drop-shadow-2xl">{activeEvent.title}</h2>
                    <div className="h-px w-24 bg-primary/20 mx-auto" />
                    <p className="text-xl md:text-2xl text-zinc-400 italic leading-relaxed max-w-2xl mx-auto font-serif bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                      "{activeEvent.description}"
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4">
                  <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-black mb-2">Choose Your Path</p>
                  {activeEvent.choices.map((choice: any) => (
                    <motion.button
                      key={choice.id}
                      whileHover={choice.canDo ? { x: 10, scale: 1.01, backgroundColor: "rgba(255,255,255,0.03)" } : {}}
                      whileTap={choice.canDo ? { scale: 0.99 } : {}}
                      disabled={!choice.canDo || isProcessing}
                      onClick={() => handleEventChoice(choice)}
                      className={cn(
                        "p-6 md:p-8 border rounded-[2rem] md:rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 transition-all group relative overflow-hidden",
                        choice.canDo ? "border-primary/20 hover:border-primary/60 bg-black/40 shadow-xl" : "border-white/5 opacity-40 grayscale cursor-not-allowed bg-zinc-900/40"
                      )}
                    >
                      {choice.canDo && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      
                      <div className="text-center md:text-left relative z-10 flex-1">
                        <p className="text-white font-serif italic text-2xl md:text-3xl group-hover:text-primary transition-colors">{choice.label}</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-[9px] text-primary uppercase font-black tracking-widest">Potential: {choice.result}</span>
                          </div>
                          {choice.success && (
                            <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                               <Info className="w-3 h-3 text-zinc-400" />
                               <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest italic">{choice.success}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col items-center md:items-end gap-2">
                           <span className={cn(
                             "text-[9px] uppercase font-black tracking-[0.2em] px-5 py-2 rounded-full border shadow-inner",
                             choice.canDo ? "bg-primary/10 border-primary/30 text-primary" : "bg-zinc-800 border-white/5 text-zinc-600"
                           )}>
                             {choice.req}
                           </span>
                           {choice.canDo ? (
                             <div className="flex items-center gap-2 text-emerald-500/60 text-[8px] uppercase font-black">
                               <CheckCircle2 className="w-3 h-3" /> Requirement Met
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-red-500/60 text-[8px] uppercase font-black">
                               <Lock className="w-3 h-3" /> Locked
                             </div>
                           )}
                        </div>
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500",
                          choice.canDo ? "bg-primary/10 border-primary/30 text-primary group-hover:rotate-12 group-hover:scale-110 shadow-glow" : "bg-zinc-900 border-white/5 text-zinc-700"
                        )}>
                           {choice.canDo ? <ChevronRight className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}


          {/* Encounter - Battle Tension */}
          {activeEncounter && (
            <div className="fixed inset-0 z-[70] bg-black/98 backdrop-blur-3xl overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-0 md:p-6">
                <motion.div 
                  initial={{ scale: 1.1, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  className="w-full h-full md:h-auto md:max-w-5xl glass-panel p-8 md:p-20 flex flex-col items-center justify-center space-y-12 border-red-900/20 bg-[#050505]/95 shadow-[0_0_200px_rgba(139,17,17,0.2)] relative"
                >
                {/* Battle Background Decor */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-600/20 to-transparent" />
                  <Skull className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] text-red-600/5 rotate-12" />
                </div>

                {/* Combat HUD Header */}
                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="flex flex-col items-center md:items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-red-600/10 border border-red-600/30 rounded text-[9px] font-black text-red-500 uppercase tracking-widest">
                        {activeEncounter.isBoss ? "Critical Threat" : "Enemy Detected"}
                      </div>
                      <div className="h-px w-10 bg-red-900/30" />
                      <div className="flex items-center gap-1">
                        {[...Array(activeEncounter.threat)].map((_, i) => (
                          <div key={i} className="w-2 h-4 bg-red-600 rounded-[1px] shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                        ))}
                      </div>
                    </div>
                    <h2 className={cn(
                      "text-6xl md:text-8xl font-serif italic tracking-tighter leading-none",
                      activeEncounter.isBoss ? "gold-gradient-text" : "text-white"
                    )}>
                      {activeEncounter.name}
                    </h2>
                    {activeEncounter.title && (
                      <p className="text-primary uppercase font-black tracking-[0.5em] text-[10px]">{activeEncounter.title}</p>
                    )}
                  </div>

                  {/* Enemy Health / Stats */}
                  <div className="flex flex-col items-center md:items-end gap-3">
                    <div className="flex gap-2">
                       {[...Array(activeEncounter.health)].map((_, i) => (
                         <motion.div 
                           key={i}
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           transition={{ delay: i * 0.1 }}
                           className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/40 flex items-center justify-center shadow-glow"
                         >
                           <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                         </motion.div>
                       ))}
                    </div>
                    <p className="text-[10px] text-red-500/60 uppercase font-black tracking-widest">Vitality Protocol: {activeEncounter.health} Units</p>
                  </div>
                </div>

                {/* Encounter Main Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full relative z-10">
                  <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-black/60 border border-white/5 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-40" />
                      <p className="relative z-10 text-xl md:text-2xl text-zinc-400 italic leading-relaxed font-serif">
                        "{activeEncounter.description}"
                      </p>
                    </div>

                    {activeEncounter.weakness && (
                      <div className="flex items-center gap-4 p-5 rounded-2xl bg-blue-950/10 border border-blue-900/20 text-blue-400">
                        <Zap className="w-5 h-5 animate-pulse" />
                        <div>
                          <p className="text-[8px] uppercase font-black tracking-widest opacity-60">Scanned Weakness</p>
                          <p className="text-xs font-serif italic">{activeEncounter.weakness}</p>
                        </div>
                      </div>
                    )}

                    {activeEncounter.phases && (
                      <div className="space-y-3">
                        <p className="text-[8px] uppercase font-black tracking-widest text-zinc-500">Boss Phases</p>
                        {activeEncounter.phases.map((phase: any) => (
                          <div key={phase.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                             <span className="text-[10px] font-black text-primary">{phase.id}</span>
                             <div className="flex-1">
                               <p className="text-xs text-white font-serif italic">{phase.name}</p>
                               <p className="text-[8px] text-zinc-500 uppercase font-bold">{phase.requirement}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Rewards Preview */}
                  <div className="flex flex-col gap-4">
                    <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-black mb-2">Combat Protocol</p>
                    {activeEncounter.responses?.map((resp: any) => (
                      <motion.button
                        key={resp.id}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(139, 17, 17, 0.1)", borderColor: "rgba(220, 38, 38, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isProcessing}
                        onClick={() => handleEncounterResolve()}
                        className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/10 group-hover:border-red-600/50 group-hover:text-red-500 transition-all">
                             {resp.action === "attack" ? <Sword className="w-5 h-5" /> : 
                              resp.action === "disable" ? <Zap className="w-5 h-5" /> :
                              <Shield className="w-5 h-5" />}
                           </div>
                           <div className="text-left">
                             <p className="text-white font-serif italic text-xl group-hover:text-red-500 transition-colors">{resp.label}</p>
                             <p className="text-[8px] uppercase tracking-widest text-zinc-500">Initiate {resp.action} sequence</p>
                           </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-red-500 transition-colors" />
                      </motion.button>
                    )) || (
                      <motion.button 
                        whileHover={{ scale: 1.02, boxShadow: "0 0 50px rgba(139, 17, 17, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEncounterResolve()}
                        disabled={isProcessing}
                        className="premium-button premium-button-red py-8 text-2xl flex items-center justify-center gap-6 rounded-[2.5rem]"
                      >
                        <Sword className="w-8 h-8" /> Engage Threat
                      </motion.button>
                    )}

                    <div className="mt-8 p-6 rounded-3xl border border-white/5 bg-black/40 relative group/spoils">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Victory Spoils</span>
                        <div className="h-px flex-1 bg-white/5 mx-4" />
                        <div className="group/help relative">
                          <Info className="w-3 h-3 text-zinc-700 cursor-help" />
                          <div className="absolute bottom-full right-0 mb-2 w-48 opacity-0 group-hover/help:opacity-100 pointer-events-none transition-all z-50">
                            <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                              Treasures earned upon a successful resolution. Failure provides no spoils.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {activeEncounter.rewards?.shards && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500 text-[9px] font-black">
                            +{activeEncounter.rewards.shards} SHARDS
                          </div>
                        )}
                        {activeEncounter.rewards?.cardId && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-400 text-[9px] font-black">
                            LEGENDARY RELIC
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Warning */}
                <p className="text-[8px] uppercase tracking-[0.8em] text-red-600/40 font-black relative z-10 animate-pulse">
                  Unauthorized Personnel detected in Restricted Maw Sector
                </p>
              </motion.div>
            </div>
          </div>
          )}


          {/* Reward Modal - Cinematic Loot Reveal */}
          {activeReward && (
            <div className="fixed inset-0 z-[80] bg-black/98 backdrop-blur-3xl overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-6">
                <motion.div 
                  initial={{ y: 100, opacity: 0, scale: 0.8 }} 
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  className="w-full max-w-xl glass-panel p-8 md:p-20 text-center space-y-10 border-primary/30 rounded-[3rem] md:rounded-[4rem] bg-zinc-950/90 shadow-[0_0_150px_rgba(200,155,44,0.1)] relative overflow-hidden"
                >
                {/* Shine Animation */}
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent skew-x-12 pointer-events-none"
                />

                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150" />
                  <div className="w-32 h-40 rounded-2xl bg-gradient-to-br from-primary/30 to-zinc-950 border border-primary/40 flex flex-col items-center justify-center mx-auto relative z-10 shadow-3xl">
                     {activeReward.type === 'card' || activeReward.type === 'ally' ? (
                        <div className="space-y-2">
                           <div className="w-16 h-20 border border-primary/50 rounded-lg flex items-center justify-center bg-primary/5">
                              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                           </div>
                           <p className="text-[8px] text-primary uppercase font-black">Vault Asset</p>
                        </div>
                     ) : (
                       <CheckCircle2 className="w-16 h-16 text-primary drop-shadow-[0_0_20px_rgba(200,155,44,0.6)]" />
                     )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-px w-8 bg-primary/20" />
                    <span className="text-[10px] uppercase font-black tracking-[0.6em] text-primary">Discovery Confirmed</span>
                    <div className="h-px w-8 bg-primary/20" />
                  </div>
                  <h3 className="text-5xl text-white font-serif italic leading-tight">{activeReward.name}</h3>
                  <p className="text-xl text-zinc-400 italic leading-relaxed font-serif max-w-sm mx-auto p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    "{activeReward.description || `The path rewards those who dare to walk its scorched length.`}"
                  </p>
                  
                  {(activeReward.type === 'card' || activeReward.type === 'ally') && (
                    <div className="flex items-center justify-center gap-3 py-4 group/vault relative cursor-help">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] text-emerald-500 uppercase font-black tracking-widest">Recorded in your Vault</span>
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 group-hover/vault:opacity-100 pointer-events-none transition-all z-50">
                         <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                           This artifact has been secured in your collectible vault. It can be viewed, traded, or sold when eligible.
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveReward(null)}
                  className="w-full premium-button premium-button-gold py-6 text-xl shadow-[0_20px_50px_rgba(200,155,44,0.2)] rounded-3xl"
                >
                  Confirm Discovery
                </motion.button>
              </motion.div>
            </div>
          </div>
          )}

          {/* Quest Completion Modal - Dramatic Achievement */}
          {questComplete && (
            <div className="fixed inset-0 z-[90] bg-black/98 backdrop-blur-3xl overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-6">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-2xl glass-panel p-10 md:p-24 text-center space-y-12 border-primary/40 bg-zinc-950/95 shadow-[0_0_200px_rgba(200,155,44,0.3)] relative overflow-hidden"
                >
                {/* Victory Burst Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-radial-vignette opacity-20 rotate-45 pointer-events-none" />
                
                <div className="relative space-y-10">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                      <Trophy className="w-10 h-10 text-primary relative z-10" />
                    </div>
                    <span className="text-[12px] uppercase tracking-[0.8em] text-primary font-black">Quest Fulfilled</span>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-6xl md:text-8xl text-white font-serif italic drop-shadow-2xl">{questComplete.title}</h2>
                    <p className="text-xl md:text-2xl text-zinc-400 italic leading-relaxed max-w-lg mx-auto font-serif">
                      {questComplete.description}
                    </p>
                  </div>

                  <div className="p-10 rounded-[3rem] bg-black/60 border border-primary/20 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-6">Legendary Reward Granted</p>
                    <div className="flex items-center justify-center gap-8">
                       <div className="w-24 h-32 rounded-xl bg-zinc-900 border border-primary/40 flex items-center justify-center shadow-glow">
                          <Sparkles className="w-10 h-10 text-primary" />
                       </div>
                       <div className="text-left">
                          <p className="text-white font-serif italic text-3xl">{questComplete.rewardName}</p>
                          <p className="text-[9px] text-primary uppercase font-black tracking-widest mt-1">Founders Edition Card</p>
                       </div>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuestComplete(null)}
                    className="w-full premium-button premium-button-gold py-8 text-2xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(200,155,44,0.3)]"
                  >
                    Continue the Journey
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Map Legend Modal */}
        <AnimatePresence>
          {isLegendOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsLegendOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg glass-panel rounded-[2.5rem] border-white/10 bg-black/80 shadow-2xl overflow-hidden p-10"
              >
                <button 
                  onClick={() => setIsLegendOpen(false)}
                  className="absolute top-8 right-8 p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-serif italic gold-gradient-text">Map Legend</h2>
                    <p className="text-xs text-zinc-500 font-serif italic">Decipher the signs of the Yellow Path.</p>
                  </div>

                  <div className="space-y-6">
                    {[
                      { icon: <Lock className="w-4 h-4 text-zinc-600" />, label: "Locked Nodes", desc: "Locked paths require keys, stats, or completed story events." },
                      { icon: <Search className="w-4 h-4 text-primary" />, label: "Search Nodes", desc: "Search nodes may reveal keys, cards, shards, or fragments." },
                      { icon: <Book className="w-4 h-4 text-emerald-500" />, label: "Story Nodes", desc: "Story choices can unlock allies, rewards, or consequences." },
                      { icon: <Skull className="w-4 h-4 text-red-500" />, label: "Boss Nodes", desc: "Boss encounters require preparation and support." },
                      { icon: <Zap className="w-4 h-4 text-amber-500" />, label: "Action Points", desc: "AP is spent to move, search, and interact. End your turn to refresh." },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-white/5 shrink-0">
                          {item.icon}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest font-black text-white">{item.label}</p>
                          <p className="text-[11px] text-zinc-500 font-serif italic leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setIsLegendOpen(false)}
                    className="premium-button w-full py-4 text-[10px] uppercase tracking-widest font-black"
                  >
                    Return to the Path
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Floating Toasts */}
        <div className="fixed bottom-32 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className={cn(
                  "px-8 py-4 rounded-2xl border-l-4 backdrop-blur-2xl shadow-2xl pointer-events-auto flex items-center gap-5 bg-black/80",
                  toast.type === 'success' ? "border-emerald-500 text-emerald-400" :
                  toast.type === 'error' ? "border-red-500 text-red-400" :
                  "border-primary text-primary"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border",
                  toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/30" :
                  toast.type === 'error' ? "bg-red-500/10 border-red-500/30" :
                  "bg-primary/10 border-primary/30"
                )}>
                  {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                </div>
                <span className="text-[11px] uppercase font-black tracking-widest leading-none">{toast.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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


