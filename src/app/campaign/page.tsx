"use client";

import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { BOOK_I_NODES, Node, BOOK_I_CLUES, CAMPAIGN_OBJECTIVES, Clue } from "@/constants/campaign";
import { MASTER_CARDS, MasterCard, PlayableEffect } from "@/constants/cards";
import { getDocs } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  MapPin, 
  Skull, 
  Search, 
  History as HistoryIcon,
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
  LogOut,
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
  HelpCircle,
  Volume2,
  VolumeX,
  Wind,
  Wand2,
  RefreshCcw,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp, collection, addDoc, getDoc, arrayUnion, increment, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BetaNotice } from "@/components/shared/BetaNotice";
import Link from "next/link";
import { ENEMIES, BOSSES, Enemy } from "@/constants/encounters";
import { playSfx, getSoundEnabled, setSoundEnabled } from "@/lib/sfx";
import { StatPop, BossWarning, UnlockAnimation, QuestCompleteEffect, RewardReveal } from "@/components/shared/GameEffects";

export default function CampaignBoard() {
  const { user, profile, isInternal } = useAuth();
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
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [showOwnerTools, setShowOwnerTools] = useState(false);
  const [storyResult, setStoryResult] = useState<any>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [activeEffects, setActiveEffects] = useState<{id: string, value: string, type: any, x: number, y: number}[]>([]);
  const [showUnlockAnim, setShowUnlockAnim] = useState(false);
  const [playerInventoryCards, setPlayerInventoryCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [combatState, setCombatState] = useState<any>(null);
  const [challengeMath, setChallengeMath] = useState<any>(null);
  const [showLog, setShowLog] = useState(false);
  const [showObjectives, setShowObjectives] = useState(true);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  // Auto-center on load
  useEffect(() => {
    if (progress?.currentNode && !loading) {
      setTimeout(centerOnCurrentNode, 500);
    }
  }, [loading, !!progress?.currentNode]);

  // Fetch Player Cards Real-time
  useEffect(() => {
    if (!user) return;
    
    const cardsRef = collection(db, "users", user.uid, "playerCards");
    const unsub = onSnapshot(cardsRef, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayerInventoryCards(cards);
    }, (error) => {
      console.error("Inventory fetch error:", error);
    });

    return () => unsub();
  }, [user]);

  // Sound System Sync
  useEffect(() => {
    setSoundEnabledState(getSoundEnabled());
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabledState(newVal);
    setSoundEnabled(newVal);
  };

  const addEffect = (value: string, type: any, x?: number, y?: number) => {
    const id = `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const effectX = x || mousePos.x || (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
    const effectY = y || mousePos.y || (typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
    setActiveEffects(prev => [...prev, { id, value, type, x: effectX, y: effectY }]);
    setTimeout(() => {
      setActiveEffects(prev => prev.filter(e => e.id !== id));
    }, 1000);
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const performChallengeCheck = (baseStat: number, statName: string, difficulty: number, cardBonus: number = 0, clueBonus: number = 0) => {
    const riskRoll = Math.floor(Math.random() * 3); // 0, 1, or 2
    const total = baseStat + cardBonus + clueBonus + riskRoll;
    const success = total >= difficulty;
    
    setChallengeMath({
      statName,
      baseStat,
      cardBonus,
      clueBonus,
      riskRoll,
      total,
      difficulty,
      success
    });
    
    return success;
  };

  const updateChronicle = async (message: string) => {
    if (!user || !progress) return;
    const newLog = [message, ...(progress.chronicleLog || [])].slice(0, 15);
    const progressRef = doc(db, "playerProgress", user.uid);
    await updateDoc(progressRef, { chronicleLog: newLog }).catch(console.error);
    setProgress((prev: any) => ({ ...prev, chronicleLog: newLog }));
  };

  const completeObjective = async (sectionId: string, taskId: string) => {
    if (!user || !progress) return;
    const currentSection = progress.sectionObjectives?.[sectionId] || { tasks: {}, completed: false };
    if (currentSection.tasks[taskId]) return; // Already completed
    
    const updatedTasks = { ...currentSection.tasks, [taskId]: true };
    const sectionDef = CAMPAIGN_OBJECTIVES[sectionId];
    const allTasksCompleted = sectionDef.tasks.every(t => updatedTasks[t.id]);
    
    const progressRef = doc(db, "playerProgress", user.uid);
    await updateDoc(progressRef, {
      [`sectionObjectives.${sectionId}.tasks.${taskId}`]: true,
      [`sectionObjectives.${sectionId}.completed`]: allTasksCompleted
    }).catch(console.error);
    
    setProgress((prev: any) => ({
      ...prev,
      sectionObjectives: {
        ...prev.sectionObjectives,
        [sectionId]: {
          ...currentSection,
          tasks: updatedTasks,
          completed: allTasksCompleted
        }
      }
    }));
    
    const taskLabel = sectionDef.tasks.find(t => t.id === taskId)?.label || taskId;
    addToast(`Objective Completed: ${taskLabel}`, 'success');
    updateChronicle(`Accomplished: ${taskLabel}`);
  };

  const discoverClue = async (clueId: string) => {
    if (!user || !progress || progress.playerClues?.includes(clueId)) return;
    
    const clue = BOOK_I_CLUES[clueId];
    if (!clue) return;
    
    const progressRef = doc(db, "playerProgress", user.uid);
    await updateDoc(progressRef, {
      playerClues: arrayUnion(clueId)
    }).catch(console.error);
    
    setProgress((prev: any) => ({
      ...prev,
      playerClues: [...(prev.playerClues || []), clueId]
    }));
    
    addToast(`Clue Discovered: ${clue.title}`, 'success');
    updateChronicle(`Found evidence: ${clue.title}`);
    
    if (clue.unlocksPath) {
      if (!progress.revealedNodes.includes(clue.unlocksPath)) {
         await updateDoc(progressRef, {
           revealedNodes: arrayUnion(clue.unlocksPath)
         }).catch(console.error);
         setProgress((prev: any) => ({
           ...prev,
           revealedNodes: [...prev.revealedNodes, clue.unlocksPath]
         }));
         addToast("A new path has been revealed!", 'info');
         playSfx('unlock');
      }
    }
  };

  const handleNodeClick = (node: Node) => {
    if (progress?.revealedNodes.includes(node.id)) {
      playSfx('click');
      setSelectedNode(node);
      setShowObjectives(false); // Clear screen for node detail
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
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProgress(data);
          
          // Campaign Start Detection
          if (data && !data.hasStartedCampaign) {
            updateDoc(doc(db, "playerProgress", user.uid), {
              hasStartedCampaign: true,
              startedAt: data.startedAt || serverTimestamp(),
              lastPlayedAt: serverTimestamp()
            }).catch(console.error);
          }
        } else {
          // Initialize progress for new users if missing
          const initialProgress = {
            userId: user.uid,
            campaignId: "book1_red_country",
            currentNode: "book1_node_001",
            completedNodes: [],
            visitedNodes: ["book1_node_001"],
            unlockedNodes: ["book1_node_001", "book1_node_002"],
            revealedNodes: ["book1_node_001", "book1_node_002", "book1_node_003", "book1_node_004", "book1_node_005", "book1_node_006"],
            actionPoints: isInternal ? 99 : 3,
            mapFragments: 0,
            inventoryKeys: [],
            keyItems: [],
            alliesUnlocked: [],
            allySupports: [],
            statusEffects: [],
            playerClues: [],
            chronicleLog: ["Entered the Red Country."],
            sectionObjectives: {
              "section_1": {
                completed: false,
                tasks: {
                  visit_derrick: false,
                  search_relic: false,
                  reach_gallows: false,
                  rescue_thatch: false,
                  survive_patrol: false,
                  unlock_gate: false
                }
              }
            },
            questProgress: {
              book1_quest_first_step: { status: "active", steps: [] }
            },
            completed: false,
            hasStartedCampaign: false,
            startedAt: null,
            lastPlayedAt: null,
            updatedAt: serverTimestamp(),
          };
          await setDoc(doc(db, "playerProgress", user.uid), initialProgress).catch(console.error);
          setProgress(initialProgress);
        }

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
      async (snap) => {
        if (snap.exists()) {
          setStats(snap.data());
        } else {
          const initialStats = {
            health: 10,
            courage: 2,
            hope: 2,
            steel: 2,
            memory: 0,
            enemiesDefeated: 0,
            searchesCompleted: 0,
            doorsOpened: 0,
            choicesMade: 0,
            bossAttempts: 0,
            highestThreat: "0",
            updatedAt: serverTimestamp()
          };
          await setDoc(doc(db, "playerStats", user.uid), initialStats).catch(console.error);
          setStats(initialStats);
        }
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
    if (isInternal) {
      console.log(`[Owner Bypass] Accessing node: ${node.id}`);
      return true;
    }
    if (!node.requirements) return true;
    const { key, stat, event, OR, AND } = node.requirements;
    
    let met = true;
    if (key && !progress?.inventoryKeys?.includes(key)) met = false;
    if (stat && stats?.[stat.name as keyof typeof stats] < stat.value) met = false;
    if (event && !progress?.completedNodes?.includes(event)) met = false;
    
    if (met && OR && Array.isArray(OR)) {
      const anyMet = OR.some(req => {
        if (req.key && progress?.inventoryKeys?.includes(req.key)) return true;
        if (req.stat && stats?.[req.stat.name as keyof typeof stats] >= req.stat.value) return true;
        if (req.event && progress?.completedNodes?.includes(req.event)) return true;
        return false;
      });
      if (!anyMet) met = false;
    }

    if (met && AND) {
      if (Array.isArray(AND)) {
        const allMet = AND.every(req => {
          if (req.key && !progress?.inventoryKeys?.includes(req.key)) return false;
          if (req.stat && stats?.[req.stat.name as keyof typeof stats] < req.stat.value) return false;
          if (req.event && !progress?.completedNodes?.includes(req.event)) return false;
          return true;
        });
        if (!allMet) met = false;
      } else {
        if (AND.key && !progress?.inventoryKeys?.includes(AND.key)) met = false;
        if (AND.items && (progress?.mapFragments || 0) < AND.items) met = false;
      }
    }

    if (!met) {
      playSfx('locked-door');
    }

    return met;
  };

  // Owner Testing Tools
  const repairProgress = async () => {
    if (!user || !profile || profile.role !== 'owner') return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "playerProgress", user.uid), {
        actionPoints: 99,
        unlockedNodes: arrayUnion(...BOOK_I_NODES.map(n => n.id)),
        revealedNodes: arrayUnion(...BOOK_I_NODES.map(n => n.id)),
        updatedAt: serverTimestamp()
      });
      addToast("Progress Repaired", "success");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const giveOwnerStats = async () => {
    if (!user || !profile || profile.role !== 'owner') return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "playerStats", user.uid), {
        health: 999,
        courage: 99,
        hope: 99,
        steel: 99,
        memory: 99,
        updatedAt: serverTimestamp()
      });
      addToast("Stats Maxed", "success");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const giveItem = async (type: string, id: string) => {
    if (!user || !profile || profile.role !== 'owner') return;
    try {
      const updates: any = {};
      if (type === 'key') updates.inventoryKeys = arrayUnion(id);
      if (type === 'fragment') updates.mapFragments = increment(1);
      await updateDoc(doc(db, "playerProgress", user.uid), updates);
      addToast(`Granted: ${id}`, "success");
    } catch (err) {
      console.error(err);
    }
  };

  const handleMove = async (node: Node) => {
    if (!user || !progress || progress.actionPoints < 1 || isProcessing) return;
    
    if (!checkRequirements(node)) return;

    setIsProcessing(true);
playSfx('ui-click');
    playSfx('map-move');
    addEffect('-1 AP', 'ap');

    try {
      const batch = writeBatch(db);
      const progressRef = doc(db, "playerProgress", user.uid);
      
      batch.update(progressRef, {
        currentNode: node.id,
        actionPoints: Math.max(0, (progress?.actionPoints || 0) - 1),
        visitedNodes: arrayUnion(node.id),
        unlockedNodes: arrayUnion(...(node.connectedNodes || [])),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      
      setSelectedNode(null);
      addToast(`Moved to ${node.name}`, 'success');

      if (node.id === "book1_node_003") {
        await completeObjective("section_1", "visit_derrick");
        await discoverClue("clue_rust_under_brick");
      }
      if (node.id === "book1_node_007") {
        await completeObjective("section_1", "reach_gallows");
      }
      if (node.id === "book1_node_004") {
        await discoverClue("clue_straw_knights_last_words");
      }
      if (node.id === "book1_node_005") {
        await discoverClue("clue_marshal_patrol_pattern");
      }
      if (node.id === "book1_node_009") {
        await discoverClue("clue_living_arches_whisper");
      }
      if (node.id === "book1_node_022") {
        await discoverClue("clue_furnace_weakness");
      }

      updateChronicle(`Moved to ${node.name}.`);

      if (node.type === "FinalBoss") {
        playSfx('boss-warning');
        triggerBoss(node);
      } else if (node.eventId && !progress.completedNodes.includes(node.eventId)) {
        playSfx('story-open');
        triggerStoryEvent(node.eventId);
      } else if (node.type === "Encounter" || node.type === "DangerPath" || node.type === "EncounterSearch" || node.type === "MiniBoss") {
        playSfx('combat-start');
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
    playSfx('ui-click');
    try {
      const pool = getSearchPool(node.id);
      const result = pool[Math.floor(Math.random() * pool.length)];
      
      const updates: any = {
        actionPoints: Math.max(0, (progress.actionPoints || 0) - 1),
        updatedAt: serverTimestamp()
      };

      if (result.type === "key") {
        updates.inventoryKeys = arrayUnion(result.id);
        playSfx('success-chime');
      } else if (result.type === "fragment") {
        updates.mapFragments = increment(1);
        playSfx('success-chime');
      } else if (result.type === "card") {
        await grantCard(result.id, "search");
        playSfx('loot');
      } else {
        playSfx('search');
      }

      await updateDoc(doc(db, "playerProgress", user.uid), updates);
      setActiveReward(result);
      addToast(`Found: ${result.name}`, 'success');
      
      await completeObjective("section_1", "search_relic");
      updateChronicle(`Searched ${node.name} and found ${result.name}.`);
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
            canDo: (stats?.courage || 0) >= 3 || isInternal,
            result: "Unlock Sir Hollin Thatch ally, +1 Courage",
            success: "You drive them back. Thatch is free.",
            failure: "The mob is too strong. You are forced to retreat."
          },
          { 
            id: "c2", 
            label: "Sneak Around the Gallows", 
            req: "Memory 2", 
            canDo: (stats?.memory || 0) >= 2 || isInternal,
            result: "Unlock Sir Hollin Thatch ally",
            success: "Shadows are your friends. Thatch is free.",
            failure: "A rusted gear squeaks. You are spotted."
          },
          { 
            id: "c3", 
            label: "Call for Mercy", 
            req: "Hope 3", 
            canDo: (stats?.hope || 0) >= 3 || isInternal,
            result: "Unlock Sir Hollin Thatch ally, +1 Hope",
            success: "Your words resonate. Even tin hearts soften.",
            failure: "Mercy is a foreign concept to these constructs."
          },
          {
            id: "fallback",
            label: "Desperate Attempt",
            req: "Health -1",
            canDo: true,
            isFallback: true,
            result: "Unlock Thatch, -1 Health, +1 Fear",
            success: "You act without the strength required. The path opens, but Oz takes payment.",
            failure: "Oz takes more than you can give."
          }
        ]
      });
      playSfx('boss-warning');
    } else if (eventId === "book1_story_living_arches") {
      setActiveEvent({
        id: eventId,
        title: "Beneath the Living Arches",
        description: "Bio-mechanical flora weaves a canopy of brass leaves and pulsing vines. The air smells of ozone and nectar.",
        choices: [
          { id: "c1", label: "Commune with the Core", req: "Memory 4", canDo: (stats?.memory || 0) >= 4 || isInternal, result: "+1 Memory, Reveal Hidden Search", success: "You understand the code. The forest speaks.", failure: "The static is deafening." },
          { id: "c2", label: "Harvest Spare Parts", req: "Steel 3", canDo: (stats?.steel || 0) >= 3 || isInternal, result: "+20 Yellow Shards", success: "You take what you need from the metal stalks.", failure: "The vines lash out." }
        ]
      });
    } else if (eventId === "book1_story_memory_of_kansas") {
      setActiveEvent({
        id: eventId,
        title: "Memory of Kansas",
        description: "The dust forms a familiar shape—a house, a dog, a voice calling your name from the cellar.",
        choices: [
          { id: "c1", label: "Embrace the Vision", req: "Hope 5", canDo: (stats?.hope || 0) >= 5 || isInternal, result: "+2 Hope, -1 Resilience", success: "The warmth is real, for a moment.", failure: "It's just ash in the wind." },
          { id: "c2", label: "Deny the Mirage", req: "Steel 4", canDo: (stats?.steel || 0) >= 4 || isInternal, result: "+2 Steel", success: "Oz is the only reality now.", failure: "Doubt creeps in." }
        ]
      });
    } else if (eventId === "book1_story_siege_begins") {
      setActiveEvent({
        id: eventId,
        title: "The Siege Begins",
        description: "Rebel forces gather at the Iron Maw. The sky is black with the smoke of the forges.",
        choices: [
          { id: "c1", label: "Lead the Vanguard", req: "Courage 6", canDo: (stats?.courage || 0) >= 6 || isInternal, result: "+2 Courage, +50 Shards", success: "You are the spearhead of the revolution.", failure: "The wall is too high." },
          { id: "c2", label: "Support the Artillery", req: "Steel 5", canDo: (stats?.steel || 0) >= 5 || isInternal, result: "+1 Steel, +30 Shards", success: "Steel meets steel. The gates buckle.", failure: "A miscalculation cost you dearly." }
        ]
      });
    }
    playSfx('ui-open');
  };

  const handleEventChoice = async (choice: any) => {
    if (!user || isProcessing) return;
    if (isInternal && !choice.canDo) {
       console.log(`[Owner Bypass] Selecting locked choice: ${choice.id}`);
    }
    setIsProcessing(true);
    playSfx('story-choice');

    try {
      let isSuccess = true;
      if (!choice.isFallback) {
        const statReq = choice.req.split(' ');
        const statName = statReq[0];
        const difficulty = parseInt(statReq[1]);
        const cardBonus = selectedCardId ? 2 : 0; // Simplified for now
        const clueBonus = 0;
        isSuccess = performChallengeCheck(stats?.[statName.toLowerCase() as any] as number || 0, statName, difficulty, cardBonus, clueBonus);
      }

      if (!isSuccess) {
        addToast(choice.failure || "The challenge proved too difficult.", "error");
        setIsProcessing(false);
        setActiveEvent(null);
        return;
      }

      const updates: any = {
        completedNodes: arrayUnion(activeEvent.id),
        updatedAt: serverTimestamp()
      };

      if (activeEvent.id === "book1_story_rescue_thatch") {
        updates.alliesUnlocked = arrayUnion("sir-hollin-thatch");
        await completeObjective("section_1", "rescue_thatch");
      }

      if (progress?.questProgress?.book1_quest_first_step?.status === "active") {
        const quest = progress.questProgress.book1_quest_first_step;
        if (!quest.steps.includes("rescue_thatch")) {
          updates[`questProgress.book1_quest_first_step.steps`] = arrayUnion("rescue_thatch");
        }
      }

      await updateDoc(doc(db, "playerProgress", user.uid), updates);
      
      if (choice.id === "c1") {
        await updateDoc(doc(db, "playerStats", user.uid), { courage: increment(1) });
        addEffect('+1 Courage', 'stat');
      }
      if (choice.id === "c3") {
        await updateDoc(doc(db, "playerStats", user.uid), { hope: increment(1) });
        addEffect('+1 Hope', 'stat');
      }
      if (choice.id === "fallback") {
        await updateDoc(doc(db, "playerStats", user.uid), { health: increment(-1) });
        addEffect('-1 Resilience', 'damage');
      }

      playSfx('success-chime');
      setStoryResult({
        choice: choice,
        title: "Event Resolved",
        message: choice.success,
        rewards: [
          { name: "Sir Hollin Thatch", type: "ally" },
          ...(choice.id === "c1" ? [{ name: "+1 Courage", type: "stat" }] : []),
          ...(choice.id === "c3" ? [{ name: "+1 Hope", type: "stat" }] : []),
          ...(choice.id === "fallback" ? [{ name: "-1 Resilience", type: "damage" }] : [])
        ]
      });
      setActiveEvent(null);
    } catch (err) {
      console.error(err);
      playSfx('failure-hit');
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerEncounter = (node: Node) => {
    const pool = Object.values(ENEMIES);
    let enemy = pool[Math.floor(Math.random() * pool.length)];
    
    if (node.type === "MiniBoss") {
      enemy = ENEMIES["clockwork_sentinel"];
    } else if (node.section === 1) {
      enemy = ENEMIES["marshal_scout"];
    }

    initiateCombat(enemy);
  };

  const triggerBoss = (node: Node) => {
    initiateCombat({ ...BOSSES["marshal_argent"], isBoss: true } as any);
  };

  const initiateCombat = (enemy: Enemy) => {
    setCombatState({
      enemy,
      enemyHp: enemy.health,
      playerHp: stats?.health || 10,
      round: 1,
      logs: [`${enemy.name} emerges from the shadows!`],
      isFinished: false,
      isVictorious: false
    });
    setActiveEncounter(null);
    playSfx('combat-start');
  };

  const handleCombatAction = async (action: 'strike' | 'defend' | 'evade' | 'retreat' | 'use_card') => {
    if (!combatState || combatState.isFinished || isProcessing) return;
    setIsProcessing(true);
    
    try {
      let playerDamage = 0;
      let enemyDamage = 0;
      let playerLog = "";
      let enemyLog = "";
      
      const cardBonus = selectedCardId ? (playerInventoryCards.find(c => c.id === selectedCardId)?.playableEffects?.find((e: any) => e.type === 'combat' || e.type === 'all')?.value || 0) : 0;
      const clueBonus = 0; // Future clue integration

      switch(action) {
        case 'strike':
          playSfx('slash');
          const strikeSuccess = performChallengeCheck(stats?.steel || 0, "Steel", combatState.enemy.defense, cardBonus, clueBonus);
          if (strikeSuccess) {
            enemyDamage = 1 + (cardBonus > 0 ? 1 : 0);
            playerLog = `You strike ${combatState.enemy.name} for ${enemyDamage} damage!`;
            playSfx('enemy-hit');
          } else {
            playerLog = `You swing at ${combatState.enemy.name} but miss.`;
          }
          break;
        case 'defend':
          playSfx('shield');
          playerLog = `You brace yourself for the next attack. (Defense +2)`;
          break;
        case 'evade':
          playSfx('evade');
          const evadeSuccess = performChallengeCheck(stats?.courage || 0, "Courage", combatState.enemy.attack + 2, cardBonus, clueBonus);
          if (evadeSuccess) {
            playerLog = `You nimbly dodge the incoming strike!`;
          } else {
            playerLog = `You try to dodge, but stumble.`;
          }
          break;
        case 'retreat':
          playSfx('retreat');
          playerLog = `You attempt to flee the encounter...`;
          if (Math.random() > 0.5) {
            setCombatState(null);
            addToast("You successfully retreated.", "info");
            setIsProcessing(false);
            return;
          } else {
            playerLog = `The path is blocked! You cannot escape yet.`;
          }
          break;
      }

      // Enemy Turn (if not defeated)
      if (combatState.enemyHp - enemyDamage > 0) {
        const enemyRoll = Math.floor(Math.random() * 20);
        const defenseBonus = action === 'defend' ? 5 : 0;
        if (enemyRoll > (stats?.steel || 0) + defenseBonus) {
          playerDamage = 1;
          enemyLog = `${combatState.enemy.name} lands a heavy blow! (-1 Health)`;
          playSfx('damage');
        } else {
          enemyLog = `${combatState.enemy.name} attacks but you deflect the blow.`;
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
        await handleEncounterWin(combatState.enemy);
      } else if (isLoss) {
        await handleEncounterLoss(combatState.enemy);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEncounterWin = async (enemy: any) => {
    playSfx('quest-complete');
    const updates: any = {
      updatedAt: serverTimestamp()
    };
    
    // Check for quest progress
    if (progress?.questProgress?.book1_quest_first_step?.status === "active") {
      const quest = progress.questProgress.book1_quest_first_step;
      if (!quest.steps.includes("survive_encounter")) {
        updates[`questProgress.book1_quest_first_step.steps`] = arrayUnion("survive_encounter");
      }
    }

    if (!user) return;
    await updateDoc(doc(db, "playerProgress", user.uid), updates);
    await completeObjective("section_1", "survive_patrol");
    
    setActiveReward({ name: "10 Yellow Shards", type: "shards", value: 10 });
    await updateDoc(doc(db, "users", user.uid), { yellowShards: increment(10) });
    updateChronicle(`Defeated ${enemy.name}. Found 10 shards.`);
  };

  const handleEncounterLoss = async (enemy: any) => {
    if (!user) return;
    playSfx('failure-hit');
    await updateDoc(doc(db, "playerStats", user.uid), { health: increment(-1) });
    addToast("You were defeated and forced to retreat.", "error");
    updateChronicle(`Defeated by ${enemy.name}. Resilience weakened.`);
    setCombatState(null);
  };

  const grantCard = async (cardId: string, source: string) => {
    if (!user) return;
    try {
      const acquiredAt = serverTimestamp();
      const tradeUnlock = new Date();
      tradeUnlock.setDate(tradeUnlock.getDate() + 14);
      const saleUnlock = new Date();
      saleUnlock.setDate(saleUnlock.getDate() + 90);

      await addDoc(collection(db, "users", user.uid, "playerCards"), {
        cardId,
        acquiredAt,
        source,
        tradeUnlockDate: tradeUnlock,
        saleUnlockDate: saleUnlock,
        marketStatus: source === "starter_quest" ? "starter_sale_locked" : "active",
        tradeable: false,
        sellable: false
      });
    } catch (err) {
      console.error("Failed to grant card:", err);
    }
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
    <MainLayout 
      fullHeight 
      showFooter={false} 
      showNavbar={false} 
      showSidebar={false} 
      showBottomNav={false}
    >
      <div className="relative h-full overflow-hidden bg-obsidian select-none">
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
        {/* Game UI Layer */}
        <AnimatePresence>
          {isUIVisible && (
            <motion.div 
              key="main-hud-overlay"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-40 p-4 pointer-events-none"
            >
              <div className="max-w-[1600px] mx-auto flex items-start justify-between gap-4">
                {/* Left: Progress & Inventory Context */}
                <div className="flex flex-col gap-2 pointer-events-auto">
                  <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-8 border-primary/20 shadow-2xl bg-black/80 backdrop-blur-3xl">
                    <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                      <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-white">
                        <LogOut className="w-4 h-4 rotate-180" />
                      </Link>
                      <div className="h-4 w-px bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-black text-primary tracking-widest leading-none mb-1">Region</span>
                        <span className="text-[10px] text-white font-serif italic whitespace-nowrap">Red Country</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 group">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 group-hover:bg-amber-500/20 transition-all">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[7px] uppercase font-black text-zinc-500 tracking-widest leading-none mb-1">Action Points</p>
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3].map((p) => (
                              <div 
                                key={p} 
                                className={cn(
                                  "w-2 h-2 rounded-full border transition-all",
                                  p <= (progress?.actionPoints || 0) ? "bg-amber-500 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "bg-transparent border-zinc-700"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 group">
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 group-hover:bg-red-500/20 transition-all">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[7px] uppercase font-black text-zinc-500 tracking-widest leading-none mb-1">Health</p>
                          <p className="text-xs text-white font-serif italic leading-none">{stats?.health || 0}/10</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 group">
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 transition-all">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[7px] uppercase font-black text-zinc-500 tracking-widest leading-none mb-1">Yellow Shards</p>
                          <p className="text-xs text-white font-serif italic leading-none">{profile?.yellowShards || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 group">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500/20 transition-all">
                          <Star className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[7px] uppercase font-black text-zinc-500 tracking-widest leading-none mb-1">Level</p>
                          <p className="text-xs text-white font-serif italic leading-none">{profile?.level || 1}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Toggles */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowObjectives(!showObjectives)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-lg backdrop-blur-md",
                        showObjectives ? "bg-primary/20 border-primary/30 text-primary" : "bg-black/60 border-white/5 text-zinc-500 hover:text-white"
                      )}
                    >
                      <Trophy className="w-3 h-3" />
                      Objectives
                    </button>
                    <button 
                      onClick={() => setShowLog(!showLog)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-lg backdrop-blur-md",
                        showLog ? "bg-primary/20 border-primary/30 text-primary" : "bg-black/60 border-white/5 text-zinc-500 hover:text-white"
                      )}
                    >
                      <HistoryIcon className="w-3 h-3" />
                      Chronicle
                    </button>
                    {isInternal && (
                      <button 
                        onClick={() => setShowOwnerTools(!showOwnerTools)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-lg backdrop-blur-md",
                          showOwnerTools ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-black/60 border-white/5 text-zinc-500 hover:text-white"
                        )}
                      >
                        <Wand2 className="w-3 h-3" />
                        Admin
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Side: Tools & Focus HUD */}
                <div className="flex flex-col items-end gap-2 pointer-events-auto">
                  <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1 border-white/5 bg-black/80 backdrop-blur-3xl shadow-2xl">
                    <button 
                      onClick={centerOnCurrentNode}
                      className="p-3 hover:bg-white/5 rounded-xl transition-all text-zinc-500 hover:text-white"
                      title="Center on Current Node"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button 
                      onClick={toggleSound}
                      className="p-3 hover:bg-white/5 rounded-xl transition-all text-zinc-500 hover:text-white"
                      title={soundEnabled ? "Mute SFX" : "Unmute SFX"}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => setIsLegendOpen(true)}
                      className="p-3 hover:bg-white/5 rounded-xl transition-all text-zinc-500 hover:text-white"
                      title="Map Legend"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button 
                      onClick={() => setIsUIVisible(false)}
                      className="p-3 hover:bg-primary/10 rounded-xl transition-all text-zinc-500 hover:text-primary group"
                      title="Focus Mode (Hide UI)"
                    >
                      <Eye className="w-4 h-4 group-hover:scale-110" />
                    </button>
                  </div>
                  
                  {/* Location Tag */}
                  <div className="px-4 py-2 rounded-full bg-white/[0.02] border border-white/5 backdrop-blur-sm flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-zinc-600" />
                    <span className="text-[9px] text-zinc-500 font-serif italic">
                      {BOOK_I_NODES.find(n => n.id === progress?.currentNode)?.name || "Obscured Road"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restore UI Button (Visible when HUD is hidden) */}
        <AnimatePresence>
          {!isUIVisible && (
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => setIsUIVisible(true)}
              className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-black/80 border border-primary/30 text-primary shadow-[0_0_30px_rgba(200,155,44,0.2)] hover:scale-105 transition-all backdrop-blur-md flex items-center gap-3"
            >
              <Eye className="w-5 h-5" />
              <span className="text-[9px] uppercase font-black tracking-widest pr-2">Show UI</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Collapsible Objectives Drawer */}
        <AnimatePresence>
          {showObjectives && (
            <motion.div 
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="fixed top-20 right-6 bottom-6 w-80 z-50 pointer-events-auto"
            >
              <div className="glass-panel h-full flex flex-col p-8 rounded-[3rem] border-primary/20 bg-black/90 backdrop-blur-3xl shadow-3xl overflow-hidden">
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white">Path Objectives</span>
                  </div>
                  <button onClick={() => setShowObjectives(false)} className="text-zinc-600 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
                  {Object.entries(CAMPAIGN_OBJECTIVES).map(([id, section]) => (
                    <div key={`objective-section-${id}`} className="space-y-4">
                      <p className="text-[9px] uppercase font-black tracking-[0.2em] text-primary/60">{section.title}</p>
                      <div className="space-y-3">
                        {section.tasks.map((task, tIdx) => {
                          const isDone = progress?.sectionObjectives?.[id]?.tasks?.[task.id];
                          return (
                            <div key={`${id}-task-${task.id || tIdx}`} className="flex items-center gap-4 group">
                              <div className={cn(
                                "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                                isDone ? "bg-primary/20 border-primary text-primary" : "border-white/10 bg-white/5"
                              )}>
                                {isDone && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className={cn(
                                "text-[10px] uppercase tracking-widest font-bold transition-colors",
                                isDone ? "text-zinc-200" : "text-zinc-500"
                              )}>
                                {task.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-black text-zinc-500">
                        <span>Overall Progress</span>
                        <span>{Math.round(((progress?.completedNodes?.length || 0) / BOOK_I_NODES.length) * 100)}%</span>
                     </div>
                     <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((progress?.completedNodes?.length || 0) / BOOK_I_NODES.length) * 100}%` }}
                          className="bg-primary h-full shadow-[0_0_10px_rgba(200,155,44,0.6)]"
                        />
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsible Chronicle Drawer */}
        <AnimatePresence>
          {showLog && (
            <motion.div 
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              className="fixed top-20 left-6 bottom-6 w-80 z-50 pointer-events-auto"
            >
              <div className="glass-panel h-full flex flex-col p-8 rounded-[3rem] border-primary/20 bg-black/90 backdrop-blur-3xl shadow-3xl overflow-hidden">
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <HistoryIcon className="w-4 h-4 text-primary" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white">Chronicle Log</span>
                  </div>
                  <button onClick={() => setShowLog(false)} className="text-zinc-600 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-hide">
                  {progress?.chronicleLog?.filter(Boolean).map((log: string, i: number) => (
                    <motion.div 
                      key={`chronicle-log-${i}-${log.slice(0, 15)}`} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 items-start relative pl-4 border-l border-white/5"
                    >
                      <div className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-primary" />
                      <p className="text-[11px] text-zinc-400 font-serif italic leading-relaxed">{log}</p>
                    </motion.div>
                  ))}
                  {(!progress?.chronicleLog || progress.chronicleLog.length === 0) && (
                    <p className="text-[10px] text-zinc-600 font-serif italic text-center py-10 uppercase tracking-widest">The pages are silent...</p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                   <p className="text-[8px] text-zinc-600 uppercase tracking-[0.3em] text-center font-bold">End of current records</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Owner Tools Panel Overlay */}
        <AnimatePresence>
          {showOwnerTools && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="glass-panel p-8 rounded-[3rem] border-primary/30 bg-black/95 backdrop-blur-3xl pointer-events-auto shadow-4xl max-w-sm w-full border-2">
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-4">
                    <Wand2 className="w-6 h-6 text-primary" />
                    <h3 className="text-sm uppercase font-black tracking-[0.2em] text-white">Arch-Admin Tools</h3>
                  </div>
                  <button onClick={() => setShowOwnerTools(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 text-zinc-500" /></button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={repairProgress} className="flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Repair Progress</span>
                    <RefreshCcw className="w-4 h-4 text-primary group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                  <button onClick={giveOwnerStats} className="flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Max Stats</span>
                    <Plus className="w-4 h-4 text-emerald-500" />
                  </button>
                  <button onClick={() => giveItem('key', 'rust-key')} className="flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Give Rust Key</span>
                    <Key className="w-4 h-4 text-amber-500" />
                  </button>
                  <button onClick={() => giveItem('fragment', 'map')} className="flex items-center justify-between px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-300">Add Fragment</span>
                    <Navigation className="w-4 h-4 text-blue-400" />
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/20 border border-primary/40 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[9px] uppercase font-black tracking-widest text-primary">System Overridden</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Map Scroll Container */}
        <div 
          id="map-container"
          className="relative w-full h-full overflow-auto cursor-grab active:cursor-grabbing pt-24 md:pt-32 pb-10 md:pb-20 px-10 md:px-20 scrollbar-hide select-none z-10"
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
                  const isUnlocked = progress?.unlockedNodes?.includes(node.id) && progress?.unlockedNodes?.includes(targetId);
                  const isTraversed = progress?.visitedNodes?.includes(node.id) && progress?.visitedNodes?.includes(targetId);
                  
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
              const isRevealed = progress?.revealedNodes?.includes(node.id);
              if (!isRevealed) return null;

              const isUnlocked = progress?.unlockedNodes?.includes(node.id);
              const isCurrent = progress?.currentNode === node.id;
              const isCompleted = progress?.completedNodes?.includes(node.id);
              const isVisited = progress?.visitedNodes?.includes(node.id);
              const isBoss = node.type.includes("Boss");

              return (
                <motion.div
                  key={`node-${node.id}`}
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
                      <div key={`legend-item-${item.label}`} className="flex items-center gap-3">
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
          {/* Node Interaction Panel - Responsive Side Drawer / Bottom Sheet */}
          <AnimatePresence>
            {selectedNode && !activeEvent && !activeEncounter && !activeReward && (
              <motion.div 
                key="selected-node-panel"
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 right-0 md:top-20 md:bottom-6 md:right-6 w-full md:w-[550px] z-[60] pointer-events-none"
              >
                <div className="h-full flex items-end md:items-stretch pointer-events-auto">
                  <div className="w-full h-[85vh] md:h-full glass-panel p-8 md:p-12 relative rounded-t-[2.5rem] md:rounded-[3rem] border-primary/20 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] bg-black/90 backdrop-blur-2xl overflow-y-auto scrollbar-hide">
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
                        <X className="w-5 h-5" />
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
                            {isInternal && (
                               <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full">
                                 <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                 <span className="text-[7px] uppercase font-black tracking-widest text-primary">Owner Override</span>
                               </div>
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
                            {selectedNode.requirements.event && (
                              <div className={cn(
                                "flex justify-between items-center p-5 rounded-xl border transition-all",
                                progress.completedNodes.includes(selectedNode.requirements.event) ? "bg-blue-500/5 border-blue-500/20 text-blue-400" : "bg-white/[0.02] border-white/5 text-zinc-600"
                              )}>
                                <div className="flex items-center gap-4">
                                  <Book className="w-4 h-4" />
                                  <span className="text-[11px] uppercase font-black tracking-widest">Complete: {selectedNode.requirements.event.split("_").pop()?.replace("-", " ")}</span>
                                </div>
                                {progress.completedNodes.includes(selectedNode.requirements.event) ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Section */}
                    <div className="space-y-4">
                      {progress?.currentNode === selectedNode.id ? (
                        <>
                          {(selectedNode.type === "Search" || selectedNode.type === "EncounterSearch" || selectedNode.type === "HiddenSearch") && (
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSearch(selectedNode)}
                              disabled={progress.actionPoints < 1 || isProcessing}
                              className="w-full premium-button premium-button-gold py-6 text-xl flex items-center justify-center gap-4 rounded-2xl disabled:opacity-30"
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
                               className="w-full premium-button py-6 text-xl flex items-center justify-center gap-4 rounded-2xl"
                             >
                               <Book className="w-6 h-6" />
                               <div className="text-left">
                                 <p className="leading-none mb-1">Begin Event</p>
                                 <p className="text-[8px] uppercase tracking-widest opacity-60">Story Unfolds</p>
                               </div>
                             </motion.button>
                          )}
                          <div className="flex items-center justify-center p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-zinc-600 font-serif italic text-sm text-center">
                             You are currently here.
                          </div>
                        </>
                      ) : progress?.unlockedNodes.includes(selectedNode.id) ? (
                        <motion.button 
                          whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(200,155,44,0.3)" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleMove(selectedNode)}
                          disabled={progress.actionPoints < 1 || isProcessing || !checkRequirements(selectedNode)}
                          className="w-full premium-button premium-button-gold py-8 text-2xl flex items-center justify-center gap-5 disabled:grayscale disabled:opacity-30 rounded-3xl"
                        >
                          <Navigation className="w-8 h-8" /> 
                          <div className="text-left">
                            <p className="leading-none mb-1">Step into the Night</p>
                            <p className="text-[9px] uppercase tracking-[0.2em] opacity-60">Travel Cost: 1 AP</p>
                          </div>
                        </motion.button>
                      ) : (
                        <div className="w-full glass-panel border-white/5 py-8 text-center rounded-3xl flex items-center justify-center gap-5 opacity-40 grayscale">
                          <Lock className="w-8 h-8" />
                          <span className="font-black uppercase tracking-[0.4em] text-lg">Path Obscured</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setSelectedNode(null)}
                        className="w-full py-4 text-[9px] text-zinc-600 hover:text-white uppercase font-black tracking-widest transition-all"
                      >
                        Dismiss View
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Story Event - Narrative Immersion */}
          {activeEvent && (
            <div className="fixed inset-0 z-[60] bg-black/98 backdrop-blur-3xl overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-4 md:p-12">
                <motion.div 
                  initial={{ y: 50, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  className="w-full max-w-4xl glass-panel p-8 md:p-20 text-center space-y-12 border-primary/30 rounded-[3rem] md:rounded-[4rem] bg-zinc-950/90 shadow-[0_0_150px_rgba(0,0,0,1)] relative overflow-hidden"
                >
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
                    <p className="text-xl md:text-2xl text-zinc-400 italic leading-relaxed max-w-2xl mx-auto font-serif bg-white/[0.02] p-8 rounded-3xl border border-white/5 shadow-inner">
                      "{activeEvent.description}"
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4 max-w-3xl mx-auto w-full">
                  <div className="flex items-center justify-between px-6">
                    <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-black">Choose Your Path</p>
                    <div className="flex gap-4">
                      {isInternal && (
                        <>
                          <button 
                            onClick={() => handleEventChoice(activeEvent.choices[0])}
                            className="text-[8px] uppercase font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-2"
                          >
                            <Wand2 className="w-3 h-3" /> Owner: Force Resolve
                          </button>
                          <div className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                            <span className="text-[7px] uppercase font-black tracking-widest text-primary">Owner Override Active</span>
                          </div>
                        </>
                      )}
                      <button 
                        onClick={() => setActiveEvent(null)}
                        className="text-[8px] uppercase font-black tracking-widest text-zinc-600 hover:text-white transition-colors"
                      >
                        Return to Map
                      </button>
                    </div>
                  </div>
                  {activeEvent.choices.filter(Boolean).map((choice: any, idx: number) => (
                    <motion.button
                      key={`choice-${activeEvent.id}-${choice.id || idx}`}
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
                             "text-[9px] uppercase font-black tracking-[0.2em] px-5 py-2 rounded-full border shadow-inner transition-all",
                             choice.canDo ? "bg-primary/10 border-primary/30 text-primary" : "bg-zinc-800 border-white/10 text-zinc-400 opacity-60"
                           )}>
                             {choice.req}
                           </span>
                           {choice.canDo ? (
                             <div className="flex items-center gap-2 text-emerald-500/60 text-[8px] uppercase font-black">
                               <CheckCircle2 className="w-3 h-3" /> Requirement Met
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-red-500/60 text-[8px] uppercase font-black">
                               <Lock className="w-3 h-3" /> Requirements Not Met
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
                
                <div className="pt-12 border-t border-white/5 flex flex-col items-center gap-6">
                   <div className="flex gap-6">
                      {[
                        { icon: <Compass className="w-4 h-4" />, label: "Courage", value: stats?.courage || 0 },
                        { icon: <Star className="w-4 h-4" />, label: "Hope", value: stats?.hope || 0 },
                        { icon: <Eye className="w-4 h-4" />, label: "Memory", value: stats?.memory || 0 },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center gap-1">
                          <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-zinc-500">
                            {s.icon}
                          </div>
                          <span className="text-[7px] uppercase font-bold text-zinc-600">{s.label}</span>
                          <span className="text-xs text-white font-serif italic">{s.value}</span>
                        </div>
                      ))}
                   </div>
                   <p className="text-[10px] text-zinc-600 font-serif italic">Your current attributes determine which paths are open to you.</p>
                </div>
              </motion.div>
            </div>
          </div>
          )}

          {/* Story Result Modal */}
          {storyResult && (
            <div key="story-result-overlay" className="fixed inset-0 z-[85] bg-black/99 backdrop-blur-3xl overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-2xl glass-panel p-12 md:p-24 text-center space-y-12 border-primary/20 bg-zinc-950/90 rounded-[3rem] shadow-2xl relative"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  
                  <div className="space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-2xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-5xl text-white font-serif italic">{storyResult.title}</h2>
                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                      <p className="text-xl text-zinc-400 italic leading-relaxed font-serif">
                        "{storyResult.message}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-black">Spoils of the Choice</p>
                    <div className="flex flex-wrap justify-center gap-4">
                      {storyResult.rewards.map((reward: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={cn(
                            "px-6 py-3 rounded-2xl border flex items-center gap-4",
                            reward.type === 'damage' ? "bg-red-500/10 border-red-500/30 text-red-500" :
                            reward.type === 'stat' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                            "bg-primary/10 border-primary/30 text-primary"
                          )}
                        >
                          {reward.type === 'damage' ? <Skull className="w-4 h-4" /> : 
                           reward.type === 'stat' ? <Sparkles className="w-4 h-4" /> : 
                           <Trophy className="w-4 h-4" />}
                          <span className="text-xs uppercase font-black tracking-widest">{reward.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStoryResult(null)}
                      className="premium-button premium-button-gold py-6 rounded-2xl flex items-center justify-center gap-3"
                    >
                      <Navigation className="w-5 h-5" /> Continue
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setStoryResult(null); setSelectedNode(null); }}
                      className="glass-panel border-white/10 hover:border-white/30 text-zinc-400 hover:text-white py-6 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px]"
                    >
                      Return to Map
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Encounter - Battle Tension */}
          {activeEncounter && (
            <div className="fixed inset-0 z-[70] bg-black/98 backdrop-blur-3xl overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-0 md:p-6">
                <motion.div 
                  initial={{ scale: 1.1, opacity: 0 }} 
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    x: isAttacking ? [0, -10, 10, -10, 10, 0] : 0,
                    filter: isAttacking ? "brightness(1.5)" : "brightness(1)"
                  }} 
                  transition={{
                    duration: isAttacking ? 0.4 : 0.6
                  }}
                  className="w-full h-full md:h-auto md:max-w-5xl glass-panel p-8 md:p-20 flex flex-col items-center justify-center space-y-12 border-red-900/20 bg-[#050505]/95 shadow-[0_0_200px_rgba(139,17,17,0.2)] relative"
                >
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-600/20 to-transparent" />
                  <Skull className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] text-red-600/5 rotate-12" />
                </div>

                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="flex flex-col items-center md:items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-red-600/10 border border-red-600/30 rounded text-[9px] font-black text-red-500 uppercase tracking-widest">
                        {activeEncounter.isBoss ? "Critical Threat" : "Enemy Detected"}
                      </div>
                      <div className="h-px w-10 bg-red-900/30" />
                      <div className="flex items-center gap-1">
                        {activeEncounter && [...Array(activeEncounter.threat)].map((_, i) => (
                          <div key={`threat-${i}`} className="w-2 h-4 bg-red-600 rounded-[1px] shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
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

                  <div className="flex flex-col items-center md:items-end gap-3">
                    <div className="flex gap-2">
                       {activeEncounter && [...Array(activeEncounter.health)].map((_, i) => (
                         <motion.div 
                           key={`health-${i}`}
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

                  <div className="flex flex-col gap-4">
                    <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-black mb-2">Combat Protocol</p>
                    {activeEncounter.responses?.map((resp: any, respIdx: number) => (
                      <motion.button
                        key={`resp-${activeEncounter.id}-${resp.id || respIdx}`}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(139, 17, 17, 0.1)", borderColor: "rgba(220, 38, 38, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isProcessing}
                        onClick={() => initiateCombat(activeEncounter)}
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
                        onClick={() => initiateCombat(activeEncounter)}
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

          {/* Turn-Based Combat Overlay */}
          <AnimatePresence>
            {combatState && (
              <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl overflow-y-auto">
                <div className="min-h-full flex items-center justify-center p-4 md:p-10">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-5xl glass-panel p-6 md:p-12 rounded-[3rem] border-primary/20 bg-zinc-950/50 shadow-3xl relative overflow-hidden"
                  >
                    {/* Background Ambience */}
                    <div className="absolute inset-0 bg-radial-vignette opacity-20 pointer-events-none" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                      {/* Left Side: Enemy & Visuals */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-red-600/20" />
                          <span className="text-[10px] uppercase font-black tracking-[0.4em] text-red-600 animate-pulse">Hostile Engagement</span>
                          <div className="h-px flex-1 bg-red-600/20" />
                        </div>
                        
                        <div className="relative group">
                          <div className="absolute inset-0 bg-red-600/10 blur-3xl rounded-full scale-125 opacity-50" />
                          <div className="aspect-[4/5] rounded-[2rem] bg-gradient-to-b from-zinc-900 to-black border border-white/5 flex items-center justify-center relative overflow-hidden">
                            <Skull className="w-32 h-32 text-red-600/20 absolute bottom-0 right-0 -mr-8 -mb-8 rotate-12" />
                            <div className="text-center space-y-4">
                              <h3 className="text-4xl text-white font-serif italic">{combatState.enemy.name}</h3>
                              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{combatState.enemy.description}</p>
                            </div>
                          </div>
                          
                          {/* HP Bar Enemy */}
                          <div className="mt-6 space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[9px] text-zinc-500 uppercase font-black">Entity Structural Integrity</span>
                              <span className="text-lg text-white font-serif italic">{combatState.enemyHp} / {combatState.enemy.health}</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                initial={{ width: "100%" }}
                                animate={{ width: `${(combatState.enemyHp / combatState.enemy.health) * 100}%` }}
                                className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Player Actions & Log */}
                      <div className="flex flex-col h-full space-y-8">
                        <div className="flex-1 space-y-6">
                           {/* Combat Logs */}
                           <div className="glass-panel p-6 rounded-2xl border-white/5 bg-black/40 h-48 overflow-y-auto scrollbar-hide space-y-3">
                              {combatState.logs.filter(Boolean).map((log: string, i: number) => (
                                <p key={`combat-log-${i}-${log.substring(0, 10)}`} className={cn(
                                  "text-[11px] font-serif italic leading-relaxed",
                                  i === 0 ? "text-white" : "text-zinc-500 opacity-60"
                                )}>
                                  {log}
                                </p>
                              ))}
                           </div>

                           {/* Player Status */}
                           <div className="grid grid-cols-2 gap-4">
                              <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02]">
                                <p className="text-[8px] text-zinc-500 uppercase font-black mb-1">Your Resilience</p>
                                <div className="flex items-center gap-2">
                                  <Heart className="w-3 h-3 text-red-500" />
                                  <span className="text-xl text-white font-serif italic">{combatState.playerHp}</span>
                                </div>
                              </div>
                              <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02]">
                                <p className="text-[8px] text-zinc-500 uppercase font-black mb-1">Active Bonus</p>
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-3 h-3 text-primary" />
                                  <span className="text-xl text-white font-serif italic">+{selectedCardId ? 2 : 0}</span>
                                </div>
                              </div>
                           </div>

                           {/* Combat Actions */}
                           {!combatState.isFinished ? (
                             <div className="grid grid-cols-2 gap-3">
                               <button 
                                 onClick={() => handleCombatAction('strike')}
                                 disabled={isProcessing}
                                 className="premium-button premium-button-gold py-4 flex flex-col items-center gap-1"
                               >
                                 <Sword className="w-4 h-4" />
                                 <span className="text-[9px] uppercase font-black">Strike</span>
                               </button>
                               <button 
                                 onClick={() => handleCombatAction('defend')}
                                 disabled={isProcessing}
                                 className="glass-panel p-4 border-white/10 hover:bg-white/5 flex flex-col items-center gap-1"
                               >
                                 <Shield className="w-4 h-4 text-zinc-400" />
                                 <span className="text-[9px] uppercase font-black text-zinc-400">Defend</span>
                               </button>
                               <button 
                                 onClick={() => handleCombatAction('evade')}
                                 disabled={isProcessing}
                                 className="glass-panel p-4 border-white/10 hover:bg-white/5 flex flex-col items-center gap-1"
                               >
                                 <Wind className="w-4 h-4 text-zinc-400" />
                                 <span className="text-[9px] uppercase font-black text-zinc-400">Evade</span>
                               </button>
                               <button 
                                 onClick={() => handleCombatAction('retreat')}
                                 disabled={isProcessing}
                                 className="glass-panel p-4 border-red-900/20 hover:bg-red-900/10 flex flex-col items-center gap-1"
                                >
                                 <LogOut className="w-4 h-4 text-red-900/40" />
                                 <span className="text-[9px] uppercase font-black text-red-900/40">Retreat</span>
                               </button>
                             </div>
                           ) : (
                             <motion.button
                               initial={{ y: 20, opacity: 0 }}
                               animate={{ y: 0, opacity: 1 }}
                               onClick={() => setCombatState(null)}
                               className={cn(
                                 "w-full py-6 rounded-2xl text-xl font-serif italic shadow-2xl",
                                 combatState.isVictorious ? "premium-button premium-button-gold" : "bg-zinc-900 text-zinc-500 border border-white/5"
                               )}
                             >
                               {combatState.isVictorious ? "Claim Victory" : "Accept Defeat"}
                             </motion.button>
                           )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Challenge Math Modal - Transparent Mechanics */}
          <AnimatePresence>
            {challengeMath && (
              <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
                 <motion.div 
                   initial={{ y: 50, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="w-full max-w-md glass-panel p-10 rounded-[3rem] border-primary/20 bg-zinc-950/90 shadow-3xl text-center space-y-8"
                 >
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-black tracking-widest text-primary">Challenge Resolution</p>
                      <h3 className="text-3xl text-white font-serif italic">The Math of Fate</h3>
                    </div>

                    <div className="space-y-4 py-6 border-y border-white/5">
                       <div className="flex justify-between text-[11px] uppercase font-bold text-zinc-500">
                          <span>{challengeMath.statName} Base</span>
                          <span className="text-white">+{challengeMath.base}</span>
                       </div>
                       <div className="flex justify-between text-[11px] uppercase font-bold text-zinc-500">
                          <span>Card Bonus</span>
                          <span className="text-emerald-500">+{challengeMath.cardBonus}</span>
                       </div>
                       <div className="flex justify-between text-[11px] uppercase font-bold text-zinc-500">
                          <span>Clue Bonus</span>
                          <span className="text-blue-500">+{challengeMath.clueBonus}</span>
                       </div>
                       <div className="flex justify-between text-[11px] uppercase font-bold text-zinc-500">
                          <span>Risk Roll (0-2)</span>
                          <span className="text-primary">+{challengeMath.roll}</span>
                       </div>
                       <div className="pt-4 flex justify-between items-center">
                          <span className="text-xs uppercase font-black text-white tracking-widest">Total Outcome</span>
                          <div className={cn(
                            "text-4xl font-serif italic",
                            challengeMath.isSuccess ? "text-emerald-500" : "text-red-500"
                          )}>
                            {challengeMath.total}
                          </div>
                       </div>
                       <div className="flex justify-between text-[9px] uppercase font-black text-zinc-600">
                          <span>Difficulty</span>
                          <span>{challengeMath.difficulty}</span>
                       </div>
                    </div>

                    <p className="text-sm text-zinc-400 font-serif italic">
                      {challengeMath.isSuccess 
                        ? "The gears of the world turn in your favor." 
                        : "The shadows grow longer. The challenge was too great."}
                    </p>

                    <button 
                      onClick={() => setChallengeMath(null)}
                      className="w-full premium-button premium-button-gold py-4 rounded-2xl"
                    >
                      Understood
                    </button>
                 </motion.div>
              </div>
            )}
          </AnimatePresence>
        </AnimatePresence>
        
        {/* Map Legend Modal */}
        <AnimatePresence>
          {isLegendOpen && (
            <div key="map-legend-modal" className="fixed inset-0 z-[110] overflow-y-auto bg-black/60 backdrop-blur-md" onClick={() => setIsLegendOpen(false)}>
              <div className="min-h-full flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-lg glass-panel rounded-[2.5rem] border-white/10 bg-black/80 shadow-2xl overflow-hidden p-10"
                  onClick={(e) => e.stopPropagation()}
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
                      { id: 'locked', icon: <Lock className="w-4 h-4 text-zinc-600" />, label: "Locked Nodes", desc: "Locked paths require keys, stats, or completed story events." },
                      { id: 'search', icon: <Search className="w-4 h-4 text-primary" />, label: "Search Nodes", desc: "Search nodes may reveal keys, cards, shards, or fragments." },
                      { id: 'story', icon: <Book className="w-4 h-4 text-emerald-500" />, label: "Story Nodes", desc: "Story choices can unlock allies, rewards, or consequences." },
                      { id: 'boss', icon: <Skull className="w-4 h-4 text-red-500" />, label: "Boss Nodes", desc: "Boss encounters require preparation and support." },
                      { id: 'ap', icon: <Zap className="w-4 h-4 text-amber-500" />, label: "Action Points", desc: "AP is spent to move, search, and interact. End your turn to refresh." },
                    ].map((item) => (
                      <div key={`legend-block-${item.id}`} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
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
        <AnimatePresence>
          {activeEffects.map(effect => (
            <StatPop 
              key={effect.id} 
              value={effect.value} 
              type={effect.type} 
              x={effect.x} 
              y={effect.y} 
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {showUnlockAnim && <UnlockAnimation />}
        </AnimatePresence>

        <AnimatePresence>
          {activeEncounter?.isBoss && <BossWarning title={activeEncounter.name} />}
        </AnimatePresence>

        <AnimatePresence>
          {questComplete && <QuestCompleteEffect title={questComplete.title} />}
        </AnimatePresence>

        {/* Quest Completion Modal - Dramatic Achievement */}
        <AnimatePresence>
          {questComplete && (
            <div className="fixed inset-0 z-[150] bg-black/98 backdrop-blur-3xl overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-6">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-2xl glass-panel p-10 md:p-24 text-center space-y-12 border-primary/40 bg-zinc-950/95 shadow-[0_0_200px_rgba(200,155,44,0.3)] relative overflow-hidden"
                >
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


