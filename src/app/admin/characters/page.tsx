"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, query, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { 
  Users, Plus, Search, Filter, Camera, Copy, CheckCircle, 
  Trash2, Archive, Globe, Shield, Sparkles, Book, Info, Lock, Zap,
  ChevronRight, MoreVertical, X, Upload, Palette, FileArchive,
  Image as ImageIcon, RefreshCw, Layers, Wand2, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CharacterReference {
  characterId: string;
  characterName: string;
  displayName: string;
  slug: string;
  bookOrigin: string;
  role: string;
  faction: string;
  description: string;
  visualNotes: string;
  personalityNotes: string;
  outfitNotes: string;
  colorPalette: string;
  
  // Reference Images (Private/Consistency Only)
  primaryReferenceImageUrl?: string;
  frontViewReferenceUrl?: string;
  backViewReferenceUrl?: string;
  leftSideReferenceUrl?: string;
  rightSideReferenceUrl?: string;
  faceCloseupReferenceUrl?: string;
  additionalReferenceImages: string[];
  
  // Public Art (Approved for Players)
  publicCardArtUrl?: string;
  publicSceneArtUrl?: string;
  publicPortraitUrl?: string;
  
  // Status & Protection
  approvedForPublicUse: boolean;
  referenceOnly: boolean;
  approvalStatus: 'reference_only' | 'approved_public' | 'archived';
  
  consistencyPrompt: string;
  cardArtPrompt: string;
  scenePrompt: string;
  negativePrompt: string;
  consistencyRules: string;
  status: 'draft' | 'approved' | 'archived'; // Existing UI status
  createdAt: any;
  updatedAt: any;
  createdBy?: string;
  updatedBy?: string;
}

const ROLES = [
  "Protagonist", "Ally", "Enemy", "Boss", "Creature", 
  "Ally / Gearling Twin", "Antagonist / Gilded Alchemist", 
  "Ally / Lion Warrior", "Ally / Mapbearer", "Ally / Mariner", 
  "Ally / Knight", "Supernatural Entity / Mystery",
  "Rebel", "Marshal Force", "Alchemist Force", 
  "Library Character", "Card Variant"
];

const FACTIONS = [
  "Yellow Path", "Gearling Twins", "Gilded Alchemist", 
  "Silver Sands", "Unknown / Yellow Path Mystery",
  "Red Country Rebels", "Tin Marshal", 
  "Emerald Veil", "Rotwood", "Glass City"
];

const CHARACTER_DEFAULTS: Record<string, Partial<CharacterReference>> = {
  "Dorothy “Dot” Gale": {
    role: "Protagonist",
    faction: "Yellow Path",
    description: "Young female protagonist with pale freckled face, serious haunted expression, brown messy hair, green hooded cloak, worn dark fantasy survival outfit, brown corset/bodice, cream blouse, sickle weapon, grim determined tone.",
    visualNotes: "Pale freckled face, serious haunted expression, brown messy hair, green hooded cloak, worn dark fantasy survival outfit, brown corset/bodice, cream blouse, sickle weapon.",
    personalityNotes: "Grim, determined, survivor.",
    outfitNotes: "Green hooded cloak, worn dark fantasy survival outfit, brown corset/bodice, cream blouse.",
    consistencyRules: "Preserve face structure, hairstyle, body type, outfit silhouette, color palette, signature accessories, weapons, markings, scars, and emotional tone. Do not redesign the character unless owner/admin approves a new version."
  },
  "Dribble Gearling": {
    role: "Ally / Gearling Twin",
    faction: "Gearling Twins",
    description: "One of the Gearling twin brothers. Young mechanic boy with tousled brown hair, bronze/golden-brown eyes, soot-smudged face, goggles on head, work shirt, overalls, tool belt, wrench/tool identity, playful inventor energy. Keep separate from Crate.",
    visualNotes: "Tousled brown hair, bronze/golden-brown eyes, soot-smudged face, goggles on head.",
    personalityNotes: "Playful, inventor energy, clever.",
    outfitNotes: "Work shirt, overalls, tool belt, goggles on head.",
    consistencyRules: "Keep separate from Crate. Preserve mechanic tools and soot-smudged face."
  },
  "Crate Gearling": {
    role: "Ally / Gearling Twin",
    faction: "Gearling Twins",
    description: "Second Gearling twin brother. Similar family resemblance to Dribble but separate identity. Young mechanic boy with goggles, overalls, tools, cross-body strap/utility gear, clever dependable energy. Keep separate from Dribble.",
    visualNotes: "Goggles, overalls, tools, cross-body strap/utility gear.",
    personalityNotes: "Clever, dependable energy.",
    outfitNotes: "Overalls, tool belt, goggles, cross-body strap.",
    consistencyRules: "Keep separate from Dribble. Preserve utility gear and goggles."
  },
  "Ezra Morrow": {
    role: "Antagonist / Gilded Alchemist",
    faction: "Gilded Alchemist",
    description: "Pale adult male antagonist with slick blond hair, sharp aristocratic face, red/crimson eyes, dark robe/coat, emerald garments, gold geometric details, sword, green magic, cold commanding presence.",
    visualNotes: "Slick blond hair, sharp aristocratic face, red/crimson eyes.",
    personalityNotes: "Cold, commanding, aristocratic.",
    outfitNotes: "Dark robe/coat, emerald garments, gold geometric details.",
    consistencyRules: "Preserve crimson eyes and sharp aristocratic features."
  },
  "Lord Llew Barron": {
    role: "Ally / Lion Warrior",
    faction: "Yellow Path",
    description: "Noble anthropomorphic lion warrior with a massive braided mane adorned with silver rings. Wears dark, engraved plate armor and a tattered, hooded dark green forest cloak. Golden-brown fur and a stoic, protective warrior-monk presence.",
    visualNotes: "Massive lion head, golden-brown fur, mane with braided sections and silver rings, stoic warrior expression.",
    personalityNotes: "Noble, protective, stoic, warrior-monk discipline.",
    outfitNotes: "Dark engraved plate armor, tattered hooded dark green cloak, leather bracers with silver inlay.",
    consistencyRules: "Preserve the specific mane braid pattern, silver ring placements, and the tattered green cloak silhouette."
  },
  "Mick": {
    role: "Ally / Mapbearer",
    faction: "Yellow Path",
    description: "Young Mapbearer boy with messy dark brown hair, freckles, and a tattered grey traveler's coat. Carries an oversized leather backpack with a rolled bedroll and holds a glowing, magical map of the Yellow Path. Curious and brave spirit.",
    visualNotes: "Messy dark hair, freckles, expressive large eyes, young explorer build.",
    personalityNotes: "Curious, brave, innocent yet determined.",
    outfitNotes: "Tattered grey/brown traveler coat, dark scarf, massive leather backpack with bedroll, worn traveler boots.",
    consistencyRules: "The glowing map and oversized backpack are inviolable signature traits. Maintain the messy hair and freckle density."
  },
  "Mira Voss": {
    role: "Ally / Mariner",
    faction: "Silver Sands",
    description: "Hardened female warrior with a signature side-shaved undercut hairstyle. Tattoos cover her entire neck, collarbone, and arms. Wears a long, tattered dark trench coat over combat traveler gear. Wields a long metal spear with an engraved tip.",
    visualNotes: "Asymmetrical side-shaved undercut, facial scars, dense geometric tattoos on neck and chest, stern gaze.",
    personalityNotes: "Fierce, hardened, mercenary discipline, stormy energy.",
    outfitNotes: "Tattered dark trench coat, leather combat vest, tactical traveler trousers, long engraved metal spear.",
    consistencyRules: "The undercut hairstyle and neck tattoos are her primary identity markers. Never omit her spear."
  },
  "Sir Hollin Thatch": {
    role: "Ally / Knight",
    faction: "Yellow Path",
    description: "Avian armored sentinel with the head of a raven. Enclosed in full black gothic plate armor with layered pauldrons and a heavy tattered black cape. A silent, grim guardian of the path's secrets.",
    visualNotes: "Raven head with black feathers and a sharp dark beak, full black gothic plate armor, tattered black cape.",
    personalityNotes: "Ceremonial, silent, grimly knightly, unyielding.",
    outfitNotes: "Gothic black plate armor, heavy layered shoulder guards, tattered floor-length black cloak.",
    consistencyRules: "Armor must always be black gothic plate. The raven head must remain featureless and mysterious."
  },
  "The Yellow Whisperer": {
    role: "Supernatural Entity / Mystery",
    faction: "Unknown / Yellow Path Mystery",
    description: "A primordial supernatural entity composed of dark, smoky matter. Features a molten fire core in its chest and a head of swirling golden flames. Trails embers as it moves. An ancient, terrifying presence from the void.",
    visualNotes: "Shadowy/obsidian smoke humanoid body, swirling fire head, molten core in the center of the chest, glowing golden eyes.",
    personalityNotes: "Ancient, primordial, terrifying, omnipresent.",
    outfitNotes: "None (Form composed of shadow and flame).",
    consistencyRules: "The internal fire core and swirling flame head are the only light sources. Body must remain shadowy and indistinct."
  }
};

const PROMPT_TEMPLATES = {
  consistency: (name: string) => `Create a professional dark fantasy character turnaround sheet for ${name} using the uploaded reference image as the source of truth. Plain white background. Include front full body, back full body, left side full body, right side full body, and close-up face portrait. Preserve all defining features, outfit, silhouette, colors, weapons, accessories, markings, and emotional tone. Do not redesign the character.`,
  card: (name: string) => `Create premium trading card artwork of ${name} in the Horror of Oz dark fantasy style. Use the official character reference as source of truth. Preserve the character’s face, outfit, colors, weapons, accessories, and silhouette. Cinematic gothic lighting, dramatic pose, high-detail painterly finish, suitable for collectible card art.`,
  scene: (name: string) => `Create a cinematic dark fantasy scene featuring ${name}. Use the official character reference as source of truth. Preserve character consistency while changing only pose, lighting, and environment. Maintain Horror of Oz gothic atmosphere.`,
  negative: () => `Do not redesign the character. Do not change age, face structure, body type, hairstyle, outfit, color palette, signature weapon, scars, tattoos, accessories, or species. Do not merge this character with another. Do not use cartoon style. Do not crop full body when full body is requested.`
};

export default function CharacterRegistry() {
  const { user, isOwner } = useAuth();
  const [characters, setCharacters] = useState<CharacterReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isAdding, setIsAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const zipInputRef = useRef<HTMLInputElement>(null);
  const singleInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [newChar, setNewChar] = useState({
    characterName: "",
    displayName: "",
    bookOrigin: "Book I",
    role: "Protagonist",
    faction: "Yellow Path",
    description: "",
  });

  useEffect(() => {
    if (!isOwner) return;
    fetchCharacters();
  }, [isOwner]);

  async function fetchCharacters() {
    setLoading(true);
    try {
      const q = query(collection(db, "characters"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ ...doc.data(), characterId: doc.id } as CharacterReference));
      setCharacters(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const createCharacterRecord = async (name: string, file: File) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const cleanName = name.replace(/\.[^/.]+$/, "");
    
    // Check if exists
    const defaults = CHARACTER_DEFAULTS[cleanName] || {};
    
    // Upload image
    const storageRef = ref(storage, `characterReferences/${id}/primary`);
    const snap = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snap.ref);

    const charData: CharacterReference = {
      characterId: id,
      characterName: cleanName,
      displayName: cleanName,
      slug: id,
      bookOrigin: "Book I",
      role: defaults.role || "Ally",
      faction: defaults.faction || "Yellow Path",
      description: defaults.description || "",
      visualNotes: defaults.visualNotes || "",
      personalityNotes: defaults.personalityNotes || "",
      outfitNotes: defaults.outfitNotes || "",
      colorPalette: "Oz Gothic",
      
      // Default to Reference Only
      primaryReferenceImageUrl: url,
      frontViewReferenceUrl: url, // Initial fallback
      additionalReferenceImages: [],
      
      publicCardArtUrl: "",
      publicSceneArtUrl: "",
      publicPortraitUrl: "",
      
      approvedForPublicUse: false,
      referenceOnly: true,
      approvalStatus: 'reference_only',
      
      consistencyPrompt: PROMPT_TEMPLATES.consistency(cleanName),
      cardArtPrompt: PROMPT_TEMPLATES.card(cleanName),
      scenePrompt: PROMPT_TEMPLATES.scene(cleanName),
      negativePrompt: PROMPT_TEMPLATES.negative(),
      consistencyRules: defaults.consistencyRules || "Preserve character integrity.",
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user?.uid,
    };

    await setDoc(doc(db, "characters", id), charData);
    return charData;
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage("Unlocking character archives...");
    
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const files = Object.values(contents.files).filter(f => !f.dir && f.name.match(/\.(jpg|jpeg|png|webp)$/i));

      let importedCount = 0;
      for (const zipFile of files) {
        const blob = await zipFile.async("blob");
        const imgFile = new File([blob], zipFile.name, { type: "image/jpeg" });
        await createCharacterRecord(zipFile.name.split('/').pop() || zipFile.name, imgFile);
        importedCount++;
      }

      setMessage(`Imported ${importedCount} characters successfully.`);
      fetchCharacters();
    } catch (err: any) {
      setMessage(`Import Error: ${err.message}`);
    } finally {
      setImporting(false);
      if (zipInputRef.current) zipInputRef.current.value = "";
    }
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage("Registering single entity...");
    
    try {
      await createCharacterRecord(file.name, file);
      setMessage("Character registered successfully.");
      fetchCharacters();
    } catch (err: any) {
      setMessage(`Upload Error: ${err.message}`);
    } finally {
      setImporting(false);
      if (singleInputRef.current) singleInputRef.current.value = "";
    }
  };

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = newChar.characterName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const charData: Partial<CharacterReference> = {
      ...newChar,
      characterId: id,
      slug: id,
      visualNotes: "",
      personalityNotes: "",
      outfitNotes: "",
      colorPalette: "Oz Gold",
      additionalReferenceImages: [],
      
      approvedForPublicUse: false,
      referenceOnly: true,
      approvalStatus: 'reference_only',
      
      consistencyPrompt: PROMPT_TEMPLATES.consistency(newChar.characterName),
      cardArtPrompt: PROMPT_TEMPLATES.card(newChar.characterName),
      scenePrompt: PROMPT_TEMPLATES.scene(newChar.characterName),
      negativePrompt: PROMPT_TEMPLATES.negative(),
      consistencyRules: "Preserve design integrity.",
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user?.uid,
    };

    try {
      await setDoc(doc(db, "characters", id), charData);
      setMessage("Character initialized in the registry.");
      setIsAdding(false);
      fetchCharacters();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage("Prompt copied to clipboard.");
    setTimeout(() => setMessage(""), 2000);
  };

  if (!isOwner) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-6 bg-black">
          <div className="gothic-panel p-12 text-center space-y-6">
            <Shield className="w-16 h-16 text-secondary mx-auto" />
            <h1 className="text-3xl font-serif italic text-white">Restricted Archives</h1>
            <p className="text-muted-foreground">Only the High Archivist may view the Character Bible.</p>
            <button onClick={() => window.history.back()} className="brass-button px-8 py-3">Withdraw</button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const stats = {
    total: characters.length,
    referenceOnly: characters.filter(c => c.referenceOnly).length,
    approvedPublic: characters.filter(c => c.approvedForPublicUse).length,
    missingPrompts: characters.filter(c => !c.consistencyPrompt || !c.cardArtPrompt || !c.scenePrompt).length,
    missingMetadata: characters.filter(c => !c.description || !c.faction || !c.role).length,
  };

  const filtered = characters.filter(c => {
    const matchesSearch = c.characterName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.faction.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRole === "all" || c.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  return (
    <MainLayout>
      <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary text-[10px] uppercase font-black tracking-[0.4em] mb-1">
              <Layers className="w-4 h-4" /> Archivist Registry
            </div>
            <h1 className="text-5xl font-serif italic text-white">Character Reference Bible</h1>
            <p className="text-muted-foreground font-serif italic max-w-xl">The official source of truth for all characters within The Horror of Oz. Ensure visual consistency across the chronicles.</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <input 
              type="file" 
              ref={zipInputRef} 
              className="hidden" 
              accept=".zip" 
              onChange={handleZipUpload}
            />
            <input 
              type="file" 
              ref={singleInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleSingleUpload}
            />
            
            <button 
              onClick={() => zipInputRef.current?.click()}
              disabled={importing}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] uppercase font-black tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              <FileArchive className="w-4 h-4" /> {importing ? "Importing..." : "Upload ZIP"}
            </button>
            
            <button 
              onClick={() => singleInputRef.current?.click()}
              disabled={importing}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] uppercase font-black tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" /> Single Image
            </button>
            
            <button 
              onClick={() => setIsAdding(true)}
              className="premium-button premium-button-gold px-8 py-3.5 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Reference
            </button>
          </div>
        </header>

        {/* High Archivist Summary Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Souls", value: stats.total, icon: <Users className="w-4 h-4" />, color: "text-white", bg: "bg-white/5" },
            { label: "Reference Only", value: stats.referenceOnly, icon: <Lock className="w-4 h-4" />, color: "text-secondary", bg: "bg-secondary/10" },
            { label: "Approved Public", value: stats.approvedPublic, icon: <Globe className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Missing Prompts", value: stats.missingPrompts, icon: <Zap className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Empty Lore", value: stats.missingMetadata, icon: <Book className="w-4 h-4" />, color: "text-red-500", bg: "bg-red-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-6 rounded-[2rem] border-white/5 bg-black/60 flex flex-col gap-3"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", stat.bg, stat.color)}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">{stat.label}</p>
                <p className={cn("text-3xl font-serif italic leading-none", stat.color)}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>


        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-black tracking-widest flex items-center gap-3 rounded-2xl backdrop-blur-md">
            {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {message}
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-[2rem] border border-white/10">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by character name or faction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 py-4 pl-14 pr-6 rounded-2xl text-sm font-serif italic focus:border-primary/50 outline-none transition-all"
            />
          </div>
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-black/40 border border-white/5 py-4 px-8 rounded-2xl text-[10px] uppercase font-black tracking-widest outline-none w-full md:w-auto appearance-none cursor-pointer hover:bg-black/60 transition-colors"
          >
            <option value="all">Filter by Role</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[550px] rounded-[3rem] bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 glass-panel border-white/5 rounded-[4rem]">
             <Users className="w-20 h-20 text-zinc-900 mx-auto mb-8" />
             <p className="text-zinc-600 font-serif italic text-2xl">The archive is silent. No characters match your query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((char) => {
              const isReferenceVerified = !!(char.primaryReferenceImageUrl || char.frontViewReferenceUrl);
              const hasPublicArt = !!(char.publicCardArtUrl || char.publicPortraitUrl);
              const isPlaceholderActive = !hasPublicArt && !char.approvedForPublicUse;

              return (
                <motion.div 
                  key={char.characterId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -12 }}
                  className="glass-panel group relative overflow-hidden rounded-[3rem] border-white/5 flex flex-col h-[550px]"
                >
                   {/* Image Section */}
                   <div className="h-72 relative bg-zinc-950 overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 opacity-60" />
                     {isReferenceVerified ? (
                       <img 
                         src={char.primaryReferenceImageUrl || char.frontViewReferenceUrl} 
                         className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" 
                         alt={char.characterName} 
                       />
                     ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-900 bg-zinc-950">
                         <Camera className="w-16 h-16" />
                         <p className="text-[10px] uppercase font-black tracking-[0.3em]">No Reference Image</p>
                       </div>
                     )}
                     
                     <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 items-end">
                       <span className={cn(
                         "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-xl border shadow-2xl",
                         char.status === 'approved' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                         char.status === 'archived' ? "bg-zinc-500/10 border-zinc-500/20 text-zinc-500" :
                         "bg-amber-500/10 border-amber-500/20 text-amber-500"
                       )}>
                         {char.status}
                       </span>
                       
                       {char.referenceOnly && (
                         <div className="flex flex-col gap-1 items-end">
                           <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/20 text-[7px] uppercase font-black tracking-widest backdrop-blur-xl shadow-2xl">
                             Reference Only
                           </span>
                           <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 border border-red-500/20 text-[7px] uppercase font-black tracking-widest backdrop-blur-xl shadow-2xl animate-pulse">
                             Asset Protected
                           </span>
                         </div>
                       )}
                     </div>
                     
                     <div className="absolute bottom-6 left-8 z-20">
                       <div className="flex items-center gap-2 text-primary text-[9px] uppercase font-black tracking-[0.2em] bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                         <Globe className="w-3 h-3" /> {char.faction}
                       </div>
                     </div>
                   </div>

                   {/* Content Section */}
                   <div className="p-10 flex-1 flex flex-col justify-between">
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <h3 className="text-3xl font-serif italic text-white group-hover:text-primary transition-colors leading-tight">{char.characterName}</h3>
                         {isPlaceholderActive && (
                           <div className="relative group/ph">
                             <AlertTriangle className="w-4 h-4 text-amber-500/40" />
                             <div className="absolute bottom-full right-0 mb-2 w-48 opacity-0 group-hover/ph:opacity-100 pointer-events-none transition-all z-50">
                               <div className="glass-panel p-3 rounded-xl border-white/10 bg-black/90 backdrop-blur-3xl text-[9px] text-zinc-400 font-serif italic leading-relaxed shadow-2xl">
                                 Public Art Pending: Players will see a silhouette placeholder.
                               </div>
                             </div>
                           </div>
                         )}
                       </div>
                       
                       {char.referenceOnly && (
                          <p className="text-[9px] text-secondary uppercase font-bold tracking-widest opacity-70">
                            ⚠️ Internal Consistency Sheet. Not shown in-game.
                          </p>
                       )}
                       <p className="text-sm text-zinc-500 font-serif italic line-clamp-2 leading-relaxed">
                         {char.description || "No description recorded in the archives yet."}
                       </p>
                     </div>

                     <div className="space-y-6 pt-8">
                        <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-zinc-600 border-t border-white/5 pt-6">
                           <span className="flex items-center gap-2"><ImageIcon className="w-3 h-3 text-primary" /> {char.role}</span>
                           <span className="flex items-center gap-2"><Book className="w-3 h-3 text-primary" /> {char.bookOrigin}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <button 
                             onClick={() => router.push(`/admin/characters/${char.characterId}`)}
                             className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                           >
                             Reference Bible
                           </button>
                           <button 
                             onClick={() => copyPrompt(char.cardArtPrompt)}
                             className="w-full py-4 rounded-2xl bg-primary/10 border border-primary/20 text-[10px] uppercase font-black tracking-widest text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                           >
                             <Wand2 className="w-3 h-3" /> Get Prompt
                           </button>
                        </div>
                     </div>
                   </div>
                </motion.div>
              );
            })}

          </div>
        )}

        {/* Status Bar */}
        <footer className="pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60 hover:opacity-100 transition-opacity">
           <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-3">
                 <Shield className="w-4 h-4" /> High Archivist Mode
              </div>
              <div className="text-[10px] uppercase font-black tracking-widest text-zinc-700">
                 Registry Core v3.0.0
              </div>
           </div>
           <div className="flex items-center gap-8 text-[10px] uppercase font-black tracking-widest text-zinc-600">
              <span className="flex items-center gap-2"><Users className="w-3 h-3" /> Total Souls: {characters.length}</span>
              <span className="flex items-center gap-2 text-emerald-500/80"><CheckCircle className="w-3 h-3" /> Approved: {characters.filter(c => c.status === 'approved').length}</span>
           </div>
        </footer>

        {/* Existing Add Modal (Optional fallback) */}
        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl glass-panel p-12 space-y-10 rounded-[4rem] border-white/10 relative shadow-2xl"
              >
                <button onClick={() => setIsAdding(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
                
                <div className="space-y-3">
                  <h2 className="text-4xl font-serif italic text-white">Summon New Character</h2>
                  <p className="text-sm text-zinc-500 font-serif italic">Initialize a manual entry in the registry bible.</p>
                </div>

                <form onSubmit={handleAddCharacter} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-1">Character Identity</label>
                      <input 
                        type="text" 
                        required
                        value={newChar.characterName}
                        onChange={e => setNewChar({...newChar, characterName: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 p-5 rounded-2xl outline-none focus:border-primary/50 transition-all font-serif italic"
                        placeholder="e.g. Dorothy Gale"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-1">Title / Display Name</label>
                      <input 
                        type="text" 
                        required
                        value={newChar.displayName}
                        onChange={e => setNewChar({...newChar, displayName: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 p-5 rounded-2xl outline-none focus:border-primary/50 transition-all font-serif italic"
                        placeholder="e.g. The Silver Seeker"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-1">Book Origin</label>
                      <input 
                        type="text" 
                        value={newChar.bookOrigin}
                        onChange={e => setNewChar({...newChar, bookOrigin: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 p-5 rounded-2xl outline-none focus:border-primary/50 transition-all font-serif italic"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-1">Designated Role</label>
                      <select 
                        value={newChar.role}
                        onChange={e => setNewChar({...newChar, role: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 p-5 rounded-2xl outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-1">Primary Faction</label>
                      <select 
                        value={newChar.faction}
                        onChange={e => setNewChar({...newChar, faction: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 p-5 rounded-2xl outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none"
                      >
                        {FACTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-1">Initial Chronicles</label>
                    <textarea 
                      value={newChar.description}
                      onChange={e => setNewChar({...newChar, description: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 p-6 rounded-3xl outline-none focus:border-primary/50 transition-all min-h-[120px] text-sm font-serif italic"
                      placeholder="The character's primary motivation and role in the chronicles..."
                    />
                  </div>

                  <button type="submit" className="w-full premium-button premium-button-gold py-6 rounded-[2.5rem] text-2xl">
                    Bind to Registry
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
