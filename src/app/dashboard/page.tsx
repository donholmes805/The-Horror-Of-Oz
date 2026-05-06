"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { BetaNotice } from "@/components/shared/BetaNotice";
import { OnboardingModal } from "@/components/shared/OnboardingModal";
import { cn } from "@/lib/utils";
import { 
  Trophy, 
  Coins, 
  Map as MapIcon, 
  BookOpen, 
  Play, 
  ArrowLeftRight, 
  Store,
  ChevronRight,
  ShieldAlert,
  Zap,
  Sword,
  Shield,
  Heart,
  Skull,
  Star,
  Info,
  Library,
  Flame,
  Sparkles,
  Lock,
  ShieldCheck,
  History,
  ChevronDown,
  HelpCircle,
  CheckCircle2,
  Wand2
} from "lucide-react";

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [announcement, setAnnouncement] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [openHelp, setOpenHelp] = useState<string | null>(null);

  const handleCloseOnboarding = async () => {
    setShowOnboarding(false);
    if (user && !progress?.seenOnboarding) {
      await updateDoc(doc(db, "playerProgress", user.uid), {
        seenOnboarding: true
      });
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.announcementText) setAnnouncement(data.announcementText);
      } catch (err) {
        console.error("Failed to fetch announcement", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoadingProgress(false);
      return;
    }

    // Safety timeout to clear loading screen
    const timeout = setTimeout(() => {
      setLoadingProgress(false);
    }, 10000);

    const unsub = onSnapshot(doc(db, "playerProgress", user.uid), 
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProgress(data);
          if (data && !data.seenOnboarding) {
            setShowOnboarding(true);
          }
        } else {
          // Initialize missing progress doc
          const initialProgress = {
            userId: user.uid,
            campaignId: "book1_red_country",
            currentNode: "book1_node_001",
            completedNodes: [],
            visitedNodes: ["book1_node_001"],
            unlockedNodes: ["book1_node_001", "book1_node_002"],
            revealedNodes: ["book1_node_001", "book1_node_002", "book1_node_003", "book1_node_004", "book1_node_005", "book1_node_006"],
            actionPoints: 3,
            mapFragments: 0,
            inventoryKeys: [],
            keyItems: [],
            alliesUnlocked: [],
            allySupports: [],
            statusEffects: [],
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
        setLoadingProgress(false);
        clearTimeout(timeout);
      },
      (error) => {
        console.error("Dashboard progress sync error:", error);
        setLoadingProgress(false);
        clearTimeout(timeout);
      }
    );

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [user]);

  const handleClaimStarter = async () => {
    if (!user || isClaiming) return;
    setIsClaiming(true);
    try {
      const cardId = "tin-woodsman-heart";
      const acquiredAt = serverTimestamp();
      const tradeUnlock = new Date();
      tradeUnlock.setDate(tradeUnlock.getDate() + 14);
      const saleUnlock = new Date();
      saleUnlock.setDate(saleUnlock.getDate() + 90);

      await addDoc(collection(db, "users", user.uid, "playerCards"), {
        cardId,
        acquiredAt,
        source: "starter_quest",
        tradeUnlockDate: tradeUnlock,
        saleUnlockDate: saleUnlock,
        marketStatus: "starter_sale_locked",
        tradeable: false,
        sellable: false
      });

      await updateDoc(doc(db, "playerProgress", user.uid), {
        "questProgress.book1_quest_first_step.claimed": true
      });

      alert("The Tin Woodsman's Heart has been added to your collection!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsClaiming(false);
    }
  };

  if (authLoading || loadingProgress) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
      <p className="font-serif italic text-amber-500/60 animate-pulse text-xl">Consulting the Oracle...</p>
    </div>
  );

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="glass-panel p-12 text-center max-w-md rounded-3xl border-white/5 bg-zinc-950/40">
            <ShieldAlert className="w-16 h-16 text-amber-500/20 mx-auto mb-6" />
            <h1 className="text-3xl font-serif italic text-white mb-4">The Oracle is Silent</h1>
            <p className="text-zinc-500 mb-8 italic">You must be a verified Pathwalker to view the chronicles. Please sign in to enter the inner sanctum.</p>
            <Link href="/login" className="premium-button block w-full text-center">Sign In</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const playerStats = [
    { label: "Health", value: profile?.health || 10, max: 10, icon: <Heart className="w-4 h-4" />, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Courage", value: profile?.courage || 2, icon: <Sword className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Hope", value: profile?.hope || 2, icon: <Star className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Steel", value: profile?.steel || 2, icon: <Shield className="w-4 h-4" />, color: "text-zinc-400", bg: "bg-zinc-400/10" },
  ];

  // Campaign CTA logic
  const getCampaignLabel = () => {
    if (!progress) return "Start Adventure";
    if (progress.completed) return "Replay Adventure";
    if (progress.hasStartedCampaign || (progress.visitedNodes && progress.visitedNodes.length > 1)) return "Resume Adventure";
    return "Start Adventure";
  };

  // Migration for existing users
  useEffect(() => {
    if (user && progress && progress.hasStartedCampaign === undefined) {
      const hasStarted = progress.visitedNodes && progress.visitedNodes.length > 1;
      updateDoc(doc(db, "playerProgress", user.uid), {
        hasStartedCampaign: hasStarted,
        lastPlayedAt: progress.updatedAt || serverTimestamp()
      }).catch(console.error);
    }
  }, [user, progress]);

  return (
    <MainLayout>
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col gap-8">
          {announcement && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 bg-amber-500/5 backdrop-blur-3xl"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-sm text-zinc-300 font-serif italic">{announcement}</p>
            </motion.div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-amber-500/30" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-amber-500/60 font-bold">Chronicles Dashboard</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif italic text-white flex flex-col md:flex-row md:items-center gap-4">
                The Path Awaits, <span className="gold-gradient-text">{profile?.username || "Pathwalker"}</span>
                <Link href="/journal" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest font-black text-zinc-500 hover:text-white hover:border-primary/30 transition-all">
                  <History className="w-3 h-3 text-primary" /> View Journal
                </Link>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="glass-panel px-8 py-4 rounded-2xl flex items-center gap-4 border-white/5 bg-zinc-950/40">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Yellow Shards</p>
                  <p className="font-serif italic text-2xl text-amber-500 leading-none mt-1">{profile?.yellowShards || 0}</p>
                </div>
              </div>
              

              {profile?.role === 'owner' && (
                <div className="glass-panel px-8 py-4 rounded-2xl flex items-center gap-4 border-primary/20 bg-primary/5 shadow-[0_0_30px_rgba(184,134,11,0.1)]">
                  <div className="p-3 rounded-xl bg-primary/20 text-primary">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.2em] text-primary/60 font-black">Divine Privilege</p>
                    <p className="font-serif italic text-2xl text-primary leading-none mt-1 uppercase tracking-tight">
                      Grand Owner
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help & Guidance Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-4">
            <HelpCircle className="w-4 h-4 text-primary/60" />
            <h2 className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/60">Pathwalker Guidance</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: "shards", q: "What are Yellow Shards?", a: "Yellow Shards are the primary currency of Oz. Use them in the Bazaar to acquire artifacts from other Pathwalkers. During beta, shards are earned through campaign searches and rewards." },
              { id: "first-card", q: "How do I earn my first card?", a: "Artifacts are earned through survival. Complete the 'First Step on the Yellow Path' quest in the campaign to claim your first Legendary relic." },
              { id: "locked", q: "Why is my card locked?", a: "Starter artifacts have a 14-day trade lock and a 90-day sale lock. Some artifacts are Soulbound and can never be traded. Cards active in a campaign session are also temporarily locked." },
              { id: "membership", q: "What does Paid Member unlock?", a: "Paid membership grants full access to the Forbidden Library—read every chapter, listen to the complete audiobook archive, and earn unique reader rewards." },
              { id: "library", q: "What is the Forbidden Library?", a: "The Library contains the true chronicles of Oz. It is where you can read the lore, listen to the whispers of the storm, and continue the story beyond the board." },
            ].map((help) => (
              <div key={help.id} className="glass-panel rounded-2xl border-white/5 bg-black/40 overflow-hidden transition-all">
                <button 
                  onClick={() => setOpenHelp(openHelp === help.id ? null : help.id)}
                  className="w-full p-5 flex items-center justify-between group"
                >
                  <span className="text-xs font-serif italic text-zinc-400 group-hover:text-white transition-colors">{help.q}</span>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-600 transition-transform duration-500", openHelp === help.id && "rotate-180 text-primary")} />
                </button>
                <AnimatePresence>
                  {openHelp === help.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-[11px] text-zinc-500 font-serif italic leading-relaxed border-t border-white/5 bg-zinc-950/20">
                        {help.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            {/* Player Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {playerStats.map((stat) => (
                <motion.div 
                  key={stat.label}
                  whileHover={{ y: -5 }}
                  className="glass-panel p-5 rounded-3xl border-white/5 bg-zinc-950/20 hover:bg-zinc-900/40 transition-all relative overflow-hidden group"
                >
                  <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity", stat.bg)} />
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2 rounded-xl", stat.bg, stat.color)}>{stat.icon}</div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-serif italic text-white">{stat.value}</span>
                    {stat.max && <span className="text-[10px] text-zinc-600 font-bold">/ {stat.max}</span>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Campaign Hero Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group rounded-[2.5rem] overflow-hidden border border-white/5 aspect-[21/10] min-h-[350px] shadow-2xl"
            >
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi44PQ9kzwTJERp0H0hZLb3h1wy_7uBTlixFYERq7UlBBGYZQZvHytLBmMAp54nWMzr2GgsiUntxPQDhn35VaylIP0rBOePcMY8Uhak12H7doRUgmHfRHREbjll4Odx9VUIe4qGpVk1pBGJjC2NKpPH8Jvv3KdNIF1l2pKI7Jsmjn206sx1LDrOO6E12xCh4mduZGs8tFU6NlDP6ryxRUP4jx-2wmJucHrgm1JPb6kJfQxdomR0j60WnvUijKcW0YBNPnnMmI82AZF"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-[2000ms]"
                alt="Campaign"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
              
              <div className="relative z-10 h-full p-12 flex flex-col justify-end max-w-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]" />
                    <span className="text-amber-500 text-[9px] uppercase font-bold tracking-[0.2em]">Live Campaign</span>
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl text-white font-serif italic mb-3 leading-tight">Blood on the Yellow Brick</h2>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed italic max-w-sm">
                  The Marshals are tracking your scent through the <span className="text-amber-500/80 font-bold">Farmhouse Ruins</span>. Do not linger in the fog.
                </p>
                <div className="flex items-center gap-8">
                  <Link href="/campaign" className="premium-button px-10 py-4 flex items-center gap-3 group/btn">
                    <span>{getCampaignLabel()}</span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                  <div className="space-y-1">
                    <p className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold">Exploration</p>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[8%] shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                      </div>
                      <span className="text-xs text-zinc-300 font-serif italic">8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-panel p-10 rounded-[2rem] space-y-8 group hover:border-amber-500/20 transition-all bg-zinc-950/40 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                    <Library className="w-7 h-7" />
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Library Progress</p>
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Book I: Prologue</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl text-white font-serif italic mb-2">Awakening in Ash</h3>
                  <p className="text-sm text-zinc-500 italic leading-relaxed">"The smell of burning straw was the first thing Dorothy remembered..."</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                    <span className="text-zinc-500">Chapter II Completion</span>
                    <span className="text-amber-500">25%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "25%" }}
                      className="bg-gradient-to-r from-amber-600 to-amber-400 h-full shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                    />
                  </div>
                </div>
                <Link href="/library" className="w-full py-4 rounded-xl border border-white/5 bg-white/5 text-center text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                  <BookOpen className="w-4 h-4 text-amber-500" /> Open Grimoire
                </Link>
              </div>

              <div className="glass-panel p-10 rounded-[2rem] space-y-8 group hover:border-red-900/40 transition-all bg-zinc-950/40 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-900/5 blur-3xl rounded-full" />
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-red-900/10 border border-red-900/20 flex items-center justify-center text-red-600 shadow-inner">
                    <Play className="w-7 h-7" />
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Audio Archive</p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Standby</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl text-white font-serif italic mb-2">Storm of Blood</h3>
                  <p className="text-sm text-zinc-500 italic leading-relaxed">Narrated by the voice of the Great Oracle. Deep immersion enabled.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                    <span className="text-zinc-500">Listen Progress</span>
                    <span className="text-zinc-600">0%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-zinc-800 h-full w-0" />
                  </div>
                </div>
                <Link href="/library" className="w-full py-4 rounded-xl border border-red-900/20 bg-red-900/5 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 hover:bg-red-900/10 hover:text-red-500 transition-all flex items-center justify-center gap-3">
                  <Play className="w-4 h-4" /> Start Ritual
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-10">
            {/* Quest & Rewards Card */}
            <div className="glass-panel p-8 rounded-[2.5rem] border-amber-500/10 relative overflow-hidden bg-zinc-950/60 shadow-2xl">
              <div className="absolute -top-10 -right-10 opacity-5">
                <Trophy className="w-48 h-48 text-amber-500" />
              </div>
              
              <div className="flex items-center gap-3 mb-8">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="text-white font-serif italic text-2xl">Active Quest</h3>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/5 relative group">
                    <div className="absolute -left-px top-4 bottom-4 w-1 bg-amber-500/50 rounded-full" />
                    <p className="text-xs text-white font-bold uppercase tracking-[0.15em] mb-2">First Step on the Yellow Path</p>
                    <p className="text-[11px] text-zinc-500 mb-6 italic leading-relaxed">Reach the Gallows Circle and survive a encounter with the Stitched Marshals.</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-[9px] text-amber-500/60 font-bold uppercase tracking-widest">
                        <span>Milestones Found</span>
                        <span className="text-amber-500">{progress?.questProgress?.book1_quest_first_step?.steps?.length || 0} / 2</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((progress?.questProgress?.book1_quest_first_step?.steps?.length || 0) / 2) * 100}%` }}
                          className="bg-gradient-to-r from-amber-600 to-amber-400 h-full shadow-[0_0_15px_rgba(245,158,11,0.6)]" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {progress?.questProgress?.book1_quest_first_step?.steps?.length >= 2 ? (
                  !progress?.questProgress?.book1_quest_first_step?.claimed ? (
                    <motion.button
                      whileHover={{ scale: 1.02, filter: "brightness(1.2)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClaimStarter}
                      disabled={isClaiming}
                      className="w-full premium-button py-5 text-sm shadow-[0_0_40px_rgba(245,158,11,0.2)]"
                    >
                      {isClaiming ? "Sealing Pact..." : "Claim Starter Card"}
                    </motion.button>
                  ) : (
                    <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Relic Secured</span>
                    </div>
                  )
                ) : (
                  <div className="p-8 border border-dashed border-white/10 rounded-3xl text-center bg-white/5 group">
                    <Lock className="w-8 h-8 text-zinc-700 mx-auto mb-4 group-hover:text-amber-500/40 transition-colors" />
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Awaiting Survival</p>
                    <p className="text-lg text-amber-500/40 font-serif italic">Legendary Heart Relic</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Navigation Icons */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/cards" className="glass-panel p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group bg-zinc-950/40">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 group-hover:scale-110 group-hover:border-amber-500/20 transition-all text-zinc-500 group-hover:text-amber-500">
                  <Library className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">Vault</span>
              </Link>
              <Link href="/trading" className="glass-panel p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group bg-zinc-950/40">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 group-hover:scale-110 group-hover:border-amber-500/20 transition-all text-zinc-500 group-hover:text-amber-500">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">Trade</span>
              </Link>
              <Link href="/marketplace" className="glass-panel p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group bg-zinc-950/40">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 group-hover:scale-110 group-hover:border-amber-500/20 transition-all text-zinc-500 group-hover:text-amber-500">
                  <Store className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">Bazaar</span>
              </Link>
              <Link href="/membership" className="glass-panel p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-red-900/40 hover:bg-red-900/5 transition-all group bg-zinc-950/40">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/5 group-hover:scale-110 group-hover:border-red-900/20 transition-all text-zinc-600 group-hover:text-red-600">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">Ascend</span>
              </Link>
            </div>

            {/* Session Ledger */}
            <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-8 bg-zinc-950/40 relative overflow-hidden">
               <div className="flex items-center gap-3">
                <Skull className="w-5 h-5 text-zinc-600" />
                <h4 className="text-white font-serif italic text-xl">Session Ledger</h4>
              </div>
              <div className="space-y-6">
                {[
                  { label: "Cards Unearthed", value: "12", icon: <Sparkles className="w-3 h-3" /> },
                  { label: "Nodes Explored", value: "8", icon: <MapIcon className="w-3 h-3" /> },
                  { label: "Hours Survived", value: "4.2h", icon: <Zap className="w-3 h-3" /> },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover/item:bg-amber-500 transition-colors" />
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{item.label}</span>
                    </div>
                    <span className="text-sm text-zinc-300 font-serif italic">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <BetaNotice />
      <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />
    </MainLayout>
  );
}

function LayoutDashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  );
}

