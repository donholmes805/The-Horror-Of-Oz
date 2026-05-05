"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";
import { 
  Shield, CheckCircle, Camera, Upload, Trash2, 
  Sparkles, Save, ArrowLeft, Info, Copy,
  Palette, Shirt, Brain, Eye, User, Book,
  Wand2, Layout, Image as ImageIcon, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

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
  status: 'draft' | 'approved' | 'archived';
  createdAt: any;
  updatedAt: any;
}

export default function CharacterDetail() {
  const { isOwner } = useAuth();
  const { characterId } = useParams();
  const [character, setCharacter] = useState<CharacterReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOwner || !characterId) return;
    fetchCharacter();
  }, [isOwner, characterId]);

  async function fetchCharacter() {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "characters", characterId as string));
      if (docSnap.exists()) {
        setCharacter(docSnap.data() as CharacterReference);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (fields: Partial<CharacterReference>) => {
    if (!character) return;
    try {
      await updateDoc(doc(db, "characters", character.characterId), {
        ...fields,
        updatedAt: serverTimestamp()
      });
      setCharacter(prev => prev ? { ...prev, ...fields } : null);
      setMessage("Archives updated.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !character) return;

    setUploadingType(type);
    try {
      const storageRef = ref(storage, `characterReferences/${character.characterId}/${type === 'additional' ? Date.now() : type}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);

      if (type === 'additional') {
        const updated = [...(character.additionalReferenceImages || []), url];
        await handleUpdate({ additionalReferenceImages: updated });
      } else if (type.startsWith('public')) {
        await handleUpdate({ [type]: url });
      } else {
        await handleUpdate({ [`${type}ReferenceUrl`]: url });
      }
      setMessage("Sacred asset uploaded.");
    } catch (err: any) {
      setMessage(`Upload Error: ${err.message}`);
    } finally {
      setUploadingType(null);
    }
  };

  const generateConsistencyPrompt = () => {
    if (!character) return "";
    return `Create a professional dark fantasy character turnaround sheet for ${character.characterName}. 
    STRICT CONSISTENCY RULE: Use the official reference image as consistency guidance for facial structure, body type, markings, and overall style. 
    Style: Horror of Oz gothic dark fantasy. Background: Flat neutral grey. 
    Include: 1. Front-facing full body standing pose. 2. Back-facing full body. 3. Side profile full body. 4. Highly detailed facial close-up portrait. 
    Visual Traits: ${character.visualNotes}. Outfit: ${character.outfitNotes}. Psychology/Vibe: ${character.personalityNotes}. 
    Consistency Rules: ${character.consistencyRules}. Maintain consistent face, anatomy, and costume across all views. High detail, sharp focus, cinematic lighting.`;
  };

  const generateCardPrompt = () => {
    if (!character) return "";
    return `Masterpiece trading card artwork of ${character.characterName}. 
    CONSISTENCY GUIDANCE: Adhere strictly to the character's official reference identity. 
    Style: The Horror of Oz premium collectible card art. Detailed painterly gothic style, heavy atmosphere, cinematic lighting, dramatic low-angle pose. 
    Character details: ${character.visualNotes}. Outfit: ${character.outfitNotes}. Atmosphere: ${character.personalityNotes}. 
    The background should be a thematic environment from the Yellow Path Chronicles. Hyper-detailed, 8k resolution.`;
  };

  const updatePrompts = () => {
    if (!character) return;
    handleUpdate({
      consistencyPrompt: generateConsistencyPrompt(),
      cardArtPrompt: generateCardPrompt(),
      scenePrompt: `Cinematic wide-shot scene featuring ${character.characterName} in a high-tension horror encounter. ${character.visualNotes}. ${character.personalityNotes}. Environment: Bleak Oz landscape, swirling shadows, gothic architecture. Dramatic storytelling composition.`
    });
  };

  if (!isOwner) return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="glass-panel p-12 text-center space-y-6 rounded-[3rem] border-white/5">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-3xl font-serif italic text-white">Forbidden Archive</h1>
          <p className="text-zinc-500 font-serif italic">Only the High Archivist may access the sacred character records.</p>
          <Link href="/dashboard" className="premium-button px-8 py-3 text-[10px] inline-block">Return to Safety</Link>
        </div>
      </div>
    </MainLayout>
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Sparkles className="w-16 h-16 text-primary animate-spin" /></div>;
  if (!character) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-serif italic">Character not found in the chronicles.</div>;

  const views = [
    { id: 'front', label: 'Front Full Body' },
    { id: 'back', label: 'Back Full Body' },
    { id: 'leftSide', label: 'Left Profile' },
    { id: 'rightSide', label: 'Right Profile' },
    { id: 'faceCloseup', label: 'Face Close-Up' },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,_#1a1405_0%,_#000_100%)] pb-24">
        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12 pt-24 md:pt-32">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4">
              <button onClick={() => router.push("/admin/characters")} className="flex items-center gap-2 text-zinc-600 hover:text-white text-[10px] uppercase font-black tracking-widest transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Library
              </button>
              <div className="flex flex-wrap items-center gap-6">
                 <h1 className="text-6xl md:text-8xl font-serif italic gold-gradient-text leading-none tracking-tighter">{character.characterName}</h1>
                 <div className="px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-2 shadow-2xl backdrop-blur-3xl">
                   <Shield className="w-4 h-4" /> High Archivist Mode
                 </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
               <button 
                 onClick={() => handleUpdate({ 
                   approvalStatus: character.approvalStatus === 'approved_public' ? 'reference_only' : 'approved_public',
                   approvedForPublicUse: character.approvalStatus !== 'approved_public'
                 })}
                 className={cn(
                   "px-10 py-4 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] transition-all border shadow-2xl",
                   character.approvalStatus === 'approved_public' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-zinc-900 text-zinc-500 border-white/5"
                 )}
               >
                 {character.approvalStatus === 'approved_public' ? "Revoke Public Approval" : "Approve as Public Artwork"}
               </button>
               <button 
                 onClick={() => handleUpdate({ status: character.status === 'approved' ? 'draft' : 'approved' })}
                 className={cn(
                   "px-10 py-4 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] transition-all border shadow-2xl",
                   character.status === 'approved' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-zinc-900 text-zinc-500 border-white/5"
                 )}
               >
                 {character.status === 'approved' ? "Revoke Production" : "Release to Production"}
               </button>
            </div>
          </header>

          {message && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-black tracking-widest flex items-center gap-3 rounded-[2rem] backdrop-blur-2xl">
              <CheckCircle className="w-5 h-5" /> {message}
            </motion.div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            {/* Visual References */}
            <div className="xl:col-span-5 space-y-12">
              <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[12px] uppercase font-black tracking-[0.5em] text-zinc-600 flex items-center gap-3">
                    <Camera className="w-5 h-5" /> Visual Archetype
                  </h2>
                  <span className="text-[9px] text-primary uppercase font-bold tracking-widest">Source of Truth</span>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {views.map((view) => (
                      <div key={view.id} className="glass-panel p-6 rounded-[3rem] border-white/5 bg-zinc-950/20 space-y-5 group relative">
                         <div className="flex items-center justify-between px-2">
                           <div className="space-y-1">
                             <p className="text-[10px] uppercase font-black tracking-widest text-zinc-700">{view.label}</p>
                             <p className="text-[7px] uppercase font-bold text-amber-600 tracking-widest">Internal Reference Only</p>
                           </div>
                           {character[`${view.id}ReferenceUrl` as keyof CharacterReference] && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                         </div>
                         <div className="aspect-[3/4] rounded-[2rem] bg-black/40 border border-white/5 relative overflow-hidden transition-all duration-700 group-hover:border-primary/30 shadow-inner">
                            {character[`${view.id}ReferenceUrl` as keyof CharacterReference] ? (
                              <img src={character[`${view.id}ReferenceUrl` as keyof CharacterReference] as string} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-900 gap-2 opacity-50">
                                 <Upload className="w-12 h-12" />
                                 <p className="text-[8px] uppercase font-black">Not Uploaded Yet</p>
                              </div>
                            )}
                            
                            <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 items-end opacity-60 group-hover:opacity-100 transition-opacity">
                               <span className="px-2 py-1 rounded-md bg-black/80 text-[6px] uppercase font-black text-amber-500 border border-amber-500/20 backdrop-blur-md">Not Public Artwork</span>
                            </div>

                            <label className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-500 backdrop-blur-sm">
                               <input type="file" className="hidden" onChange={e => handleFileUpload(e, view.id)} />
                               <div className="text-center space-y-3">
                                  <Upload className="w-10 h-10 mx-auto text-primary" />
                                  <p className="text-[10px] uppercase font-black tracking-widest text-primary">
                                    {uploadingType === view.id ? 'Ascending...' : `Upload ${view.label}`}
                                  </p>
                                  <p className="text-[7px] uppercase font-bold text-zinc-500">Restricted to Archives</p>
                               </div>
                            </label>
                         </div>
                      </div>
                    ))}
                 </div>

                 {/* Public Art Section */}
                 <section className="space-y-8 pt-12 border-t border-white/5">
                    <div className="flex items-center justify-between px-2">
                      <h2 className="text-[12px] uppercase font-black tracking-[0.5em] text-emerald-500 flex items-center gap-3">
                        <Layout className="w-5 h-5" /> Public Masterpieces
                      </h2>
                      <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Visible to Players</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {[
                         { id: 'publicCardArtUrl', label: 'Official Card Art' },
                         { id: 'publicPortraitUrl', label: 'Character Portrait' },
                       ].map((art) => (
                         <div key={art.id} className="glass-panel p-6 rounded-[3rem] border-white/5 bg-zinc-950/20 space-y-5 group relative">
                            <div className="flex items-center justify-between px-2">
                               <p className="text-[10px] uppercase font-black tracking-widest text-zinc-700">{art.label}</p>
                               {character[art.id as keyof CharacterReference] && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                            </div>
                            <div className="aspect-square rounded-[2rem] bg-black/40 border border-white/5 relative overflow-hidden transition-all duration-700 group-hover:border-emerald-500/30 shadow-inner">
                               {character[art.id as keyof CharacterReference] ? (
                                 <img src={character[art.id as keyof CharacterReference] as string} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" />
                               ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-zinc-900 gap-2 opacity-50">
                                    <Sparkles className="w-12 h-12" />
                                    <p className="text-[8px] uppercase font-black">No Approved Art</p>
                                 </div>
                               )}

                               <label className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-500 backdrop-blur-sm">
                                  <input type="file" className="hidden" onChange={e => handleFileUpload(e, art.id)} />
                                  <div className="text-center space-y-3">
                                     <Upload className="w-10 h-10 mx-auto text-emerald-500" />
                                     <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500">
                                       {uploadingType === art.id ? 'Ascending...' : `Upload Public ${art.label}`}
                                     </p>
                                     <p className="text-[7px] uppercase font-bold text-zinc-500">Approved for Production</p>
                                  </div>
                               </label>
                            </div>
                         </div>
                       ))}
                    </div>
                 </section>
              </section>
            </div>

            {/* Configuration Data */}
            <div className="xl:col-span-7 space-y-16">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                      <label className="text-[11px] uppercase font-black tracking-widest text-zinc-600 flex items-center gap-2"><Eye className="w-4 h-4" /> Facial Architecture</label>
                      <button onClick={() => handleUpdate({ visualNotes: character.visualNotes })} className="text-[9px] text-primary hover:text-white transition-all font-black">SAVE</button>
                    </div>
                    <textarea 
                      value={character.visualNotes}
                      onChange={e => setCharacter({...character, visualNotes: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 p-8 rounded-[2.5rem] outline-none focus:border-primary/50 transition-all min-h-[140px] text-sm font-serif italic text-zinc-300 leading-relaxed shadow-inner"
                      placeholder="Bone structure, eye hue, scars, signature expression..."
                    />
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                      <label className="text-[11px] uppercase font-black tracking-widest text-zinc-600 flex items-center gap-2"><Shirt className="w-4 h-4" /> Regalia & Armor</label>
                      <button onClick={() => handleUpdate({ outfitNotes: character.outfitNotes })} className="text-[9px] text-primary hover:text-white transition-all font-black">SAVE</button>
                    </div>
                    <textarea 
                      value={character.outfitNotes}
                      onChange={e => setCharacter({...character, outfitNotes: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 p-8 rounded-[2.5rem] outline-none focus:border-primary/50 transition-all min-h-[140px] text-sm font-serif italic text-zinc-300 leading-relaxed shadow-inner"
                      placeholder="Silhouettes, textures, symbolic emblems, weapons..."
                    />
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                      <label className="text-[11px] uppercase font-black tracking-widest text-zinc-600 flex items-center gap-2"><Brain className="w-4 h-4" /> Psychological Profile</label>
                      <button onClick={() => handleUpdate({ personalityNotes: character.personalityNotes })} className="text-[9px] text-primary hover:text-white transition-all font-black">SAVE</button>
                    </div>
                    <textarea 
                      value={character.personalityNotes}
                      onChange={e => setCharacter({...character, personalityNotes: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 p-8 rounded-[2.5rem] outline-none focus:border-primary/50 transition-all min-h-[140px] text-sm font-serif italic text-zinc-300 leading-relaxed shadow-inner"
                      placeholder="Temperament, battle stance, emotional triggers..."
                    />
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                      <label className="text-[11px] uppercase font-black tracking-widest text-zinc-600 flex items-center gap-2"><Shield className="w-4 h-4" /> Consistency Edicts</label>
                      <button onClick={() => handleUpdate({ consistencyRules: character.consistencyRules })} className="text-[9px] text-primary hover:text-white transition-all font-black">SAVE</button>
                    </div>
                    <textarea 
                      value={character.consistencyRules}
                      onChange={e => setCharacter({...character, consistencyRules: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 p-8 rounded-[2.5rem] outline-none focus:border-primary/50 transition-all min-h-[140px] text-sm font-serif italic text-zinc-300 leading-relaxed shadow-inner"
                      placeholder="Inviolable traits. e.g. 'Never remove the emerald pendant'..."
                    />
                 </div>
              </section>

              {/* Prompt Engineering Hub */}
              <section className="space-y-10 pt-12 border-t border-white/5">
                 <header className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                    <div className="space-y-2 text-center md:text-left">
                      <h2 className="text-[12px] uppercase font-black tracking-[0.6em] text-primary flex items-center gap-3">
                        <Sparkles className="w-5 h-5" /> Artificer's Prompts
                      </h2>
                      <p className="text-[10px] text-zinc-700 uppercase font-bold tracking-[0.2em]">Generate high-fidelity assets from the bible</p>
                    </div>
                    <button 
                      onClick={updatePrompts}
                      className="premium-button premium-button-gold px-10 py-3.5 text-[10px] flex items-center gap-3 shadow-2xl"
                    >
                      <RefreshCw className="w-4 h-4" /> Regenerate Manifests
                    </button>
                 </header>

                 <div className="grid grid-cols-1 gap-10">
                    {/* Card Art Prompt */}
                    <div className="glass-panel p-10 rounded-[4rem] border-primary/20 bg-primary/[0.02] space-y-6 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Layout className="w-24 h-24 text-primary" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-px bg-primary/40" />
                        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/80">Collectible Card Manifest</p>
                      </div>
                      <p className="text-lg font-serif italic text-zinc-300 leading-relaxed max-w-2xl relative z-10">
                         {character.cardArtPrompt || "Manifest not yet generated."}
                      </p>
                      <div className="flex gap-4 relative z-10">
                         <button 
                           onClick={() => {
                             navigator.clipboard.writeText(character.cardArtPrompt);
                             setMessage("Card Manifest copied.");
                             setTimeout(() => setMessage(""), 2000);
                           }}
                           className="px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-[9px] uppercase font-black tracking-widest text-primary hover:bg-primary/20 transition-all flex items-center gap-2 shadow-lg"
                         >
                           <Copy className="w-4 h-4" /> Copy Manifest
                         </button>
                      </div>
                    </div>

                    {/* Scene Art Prompt */}
                    <div className="glass-panel p-10 rounded-[4rem] border-zinc-800 bg-zinc-950/40 space-y-6 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <ImageIcon className="w-24 h-24 text-white" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-px bg-zinc-700" />
                        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-600">Cinematic Scene Manifest</p>
                      </div>
                      <p className="text-lg font-serif italic text-zinc-400 leading-relaxed max-w-2xl relative z-10">
                         {character.scenePrompt || "Manifest not yet generated."}
                      </p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(character.scenePrompt);
                          setMessage("Scene Manifest copied.");
                          setTimeout(() => setMessage(""), 2000);
                        }}
                        className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[9px] uppercase font-black tracking-widest text-zinc-500 hover:bg-white/10 transition-all flex items-center gap-2 w-fit relative z-10 shadow-lg"
                      >
                        <Copy className="w-4 h-4" /> Copy Manifest
                      </button>
                    </div>

                    {/* Negative Prompt */}
                    <div className="space-y-4 px-4">
                      <label className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-700 ml-1">Negative Corruption Filter</label>
                      <input 
                        type="text" 
                        value={character.negativePrompt}
                        onChange={e => setCharacter({...character, negativePrompt: e.target.value})}
                        onBlur={() => handleUpdate({ negativePrompt: character.negativePrompt })}
                        className="w-full bg-black/40 border border-white/5 p-6 rounded-2xl text-sm font-serif italic text-zinc-500 shadow-inner focus:border-primary/30 outline-none transition-all"
                      />
                    </div>

                    <div className="p-10 bg-primary/5 border border-primary/10 rounded-[3rem] flex items-start gap-8 shadow-2xl backdrop-blur-3xl">
                       <Wand2 className="w-10 h-10 text-primary shrink-0" />
                       <div className="space-y-4">
                          <h4 className="text-[11px] uppercase font-black tracking-[0.4em] text-primary">Archivist's Protocol</h4>
                          <p className="text-sm text-zinc-400 font-serif italic leading-relaxed">
                            Visual integrity is the soul of the chronicles. Every stroke of generated art must align with these edicts. If a character drifts from their reference, the nightmare becomes diluted. Preserve the vision at all costs.
                          </p>
                       </div>
                    </div>
                 </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
