"use client";

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Pause, 
  Save, 
  Trash2,
  AlertTriangle,
  Loader2,
  FileAudio,
  ShieldAlert,
  Edit3,
  Eye,
  Check,
  Music,
  Book,
  Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { BOOKS } from '@/constants/library';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function BookChaptersAdminPage() {
  const { bookId } = useParams();
  const { profile, isOwner, user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<any[]>([]);
  const [book, setBook] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = profile?.role === "admin" || isOwner;

  useEffect(() => {
    async function fetchData() {
      if (!isAdmin || !bookId) return;
      
      const foundBook = BOOKS.find(b => b.bookId === bookId);
      setBook(foundBook);

      try {
        // Fetch existing audio records
        const q = query(collection(db, "audiobookChapters"), where("bookId", "==", bookId));
        const snap = await getDocs(q);
        const audioRecords = snap.docs.reduce((acc: any, d) => {
          acc[d.data().chapterId] = { id: d.id, ...d.data() };
          return acc;
        }, {});

        // Build list of chapters based on totalChapters
        const list = [];
        for (let i = 0; i <= (foundBook?.totalChapters || 0); i++) {
          const chId = `ch-${i}`;
          list.push({
            chapterId: chId,
            chapterNumber: i,
            title: i === 0 ? "Prologue" : `Chapter ${i}`,
            audioRecord: audioRecords[chId] || null
          });
        }
        setChapters(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAdmin, bookId]);

  const handleSave = async (data: any) => {
    if (!bookId || !selectedChapter) return;
    setIsUploading(true);
    try {
      const recordId = `${bookId}_${selectedChapter.chapterId}`;
      const payload = {
        ...data,
        bookId,
        chapterId: selectedChapter.chapterId,
        bookNumber: book.bookNumber,
        chapterNumber: selectedChapter.chapterNumber,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      };

      if (!selectedChapter.audioRecord) {
        payload.uploadedAt = serverTimestamp();
        payload.uploadedBy = user?.uid;
        payload.status = payload.status || 'draft';
      }

      await setDoc(doc(db, "audiobookChapters", recordId), payload, { merge: true });
      
      setMessage("Chapter record saved successfully.");
      setIsEditing(false);
      setSelectedChapter(null);
      // Refresh list
      router.refresh();
      window.location.reload(); 
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm("Permanently delete this narration record? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "audiobookChapters", recordId));
      setMessage("Record deleted.");
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) return null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Link href="/admin/books" className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-zinc-600 hover:text-primary transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Volumes
            </Link>
            <div className="flex items-center gap-3">
              <Book className="w-5 h-5 text-primary" />
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-500">{book?.subtitle}</span>
            </div>
            <h1 className="text-5xl text-white font-serif italic">{book?.title}</h1>
          </div>
          <div className="text-right">
             <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">
                {chapters.filter(c => c.audioRecord?.status === 'approved').length} / {book?.totalChapters} Approved
             </div>
          </div>
        </header>

        {message && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest animate-pulse">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
             <h2 className="text-2xl text-white font-serif italic border-b border-white/5 pb-4">Chapter Manifest</h2>
             <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide pr-2">
                {chapters.map((ch) => (
                  <div 
                    key={ch.chapterId}
                    onClick={() => setSelectedChapter(ch)}
                    className={cn(
                      "p-6 rounded-2xl border transition-all cursor-pointer group",
                      selectedChapter?.chapterId === ch.chapterId 
                        ? "bg-primary/10 border-primary/40 shadow-[0_0_30px_rgba(184,134,11,0.1)]" 
                        : "bg-white/5 border-white/5 hover:border-white/10"
                    )}
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                             "w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black border",
                             ch.audioRecord?.status === 'approved' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                             ch.audioRecord?.status === 'draft' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                             "bg-zinc-900 border-white/5 text-zinc-700"
                           )}>
                              {ch.chapterNumber}
                           </div>
                           <div>
                              <p className="text-white font-serif italic text-lg">{ch.title}</p>
                              <p className="text-[9px] uppercase font-black tracking-widest text-zinc-600">
                                {ch.audioRecord ? `${ch.audioRecord.narrator || 'No Narrator'} • ${ch.audioRecord.duration || '??'}s` : "No Narration Uploaded"}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {ch.audioRecord?.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                           {ch.audioRecord?.status === 'draft' && <Clock className="w-5 h-5 text-amber-500" />}
                           {!ch.audioRecord && <XCircle className="w-5 h-5 text-zinc-800" />}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-6">
             <h2 className="text-2xl text-white font-serif italic border-b border-white/5 pb-4">Narration Control</h2>
             <AnimatePresence mode="wait">
                {selectedChapter ? (
                  <motion.div 
                    key={selectedChapter.chapterId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-panel p-10 rounded-[3rem] border-white/5 bg-black/40 space-y-8"
                  >
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-primary">Editing Metadata</span>
                          <h3 className="text-3xl text-white font-serif italic">{selectedChapter.title}</h3>
                       </div>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-3 rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-colors"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          {selectedChapter.audioRecord && (
                            <button 
                              onClick={() => handleDelete(selectedChapter.audioRecord.id)}
                              className="p-3 rounded-xl bg-red-950/20 text-red-900/40 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600">Audio Source URL (Firebase Storage)</label>
                             <input 
                               type="text"
                               defaultValue={selectedChapter.audioRecord?.audioUrl || ""}
                               placeholder="https://firebasestorage.googleapis.com/..."
                               className="w-full bg-zinc-950 border border-white/5 rounded-xl px-6 py-4 text-xs text-white focus:border-primary/50 outline-none transition-all font-mono"
                               id="audioUrl"
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600">Narrator</label>
                                <input 
                                  type="text"
                                  defaultValue={selectedChapter.audioRecord?.narrator || "Don E. Holmes III"}
                                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-6 py-4 text-xs text-white focus:border-primary/50 outline-none transition-all"
                                  id="narrator"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600">Duration (seconds)</label>
                                <input 
                                  type="number"
                                  defaultValue={selectedChapter.audioRecord?.duration || 0}
                                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-6 py-4 text-xs text-white focus:border-primary/50 outline-none transition-all"
                                  id="duration"
                                />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] uppercase font-black tracking-widest text-zinc-600">Status</label>
                             <select 
                               id="status"
                               defaultValue={selectedChapter.audioRecord?.status || "draft"}
                               className="w-full bg-zinc-950 border border-white/5 rounded-xl px-6 py-4 text-xs text-white focus:border-primary/50 outline-none transition-all appearance-none"
                             >
                                <option value="draft">Draft (Admin Only)</option>
                                <option value="approved">Approved (Public)</option>
                                <option value="unavailable">Unavailable</option>
                             </select>
                          </div>
                       </div>

                       <div className="pt-8 border-t border-white/5 flex gap-4">
                          <button 
                            disabled={isUploading}
                            onClick={() => {
                              const data = {
                                audioUrl: (document.getElementById('audioUrl') as HTMLInputElement).value,
                                narrator: (document.getElementById('narrator') as HTMLInputElement).value,
                                duration: parseInt((document.getElementById('duration') as HTMLInputElement).value),
                                status: (document.getElementById('status') as HTMLSelectElement).value,
                                title: selectedChapter.title
                              };
                              handleSave(data);
                            }}
                            className="flex-1 premium-button premium-button-gold py-5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span className="text-[10px] uppercase font-black tracking-widest">Save Narration</span>
                          </button>
                          {selectedChapter.audioRecord?.audioUrl && (
                            <Link href={`/library/${bookId}/audio/${selectedChapter.chapterId}`} target="_blank">
                              <button className="px-8 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Preview</span>
                              </button>
                            </Link>
                          )}
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-panel p-20 rounded-[3rem] border-white/5 bg-black/40 flex flex-col items-center justify-center text-center space-y-6">
                     <FileAudio className="w-16 h-16 text-zinc-800" />
                     <div className="space-y-2">
                        <h3 className="text-xl text-zinc-600 font-serif italic">No Chapter Selected</h3>
                        <p className="text-[9px] uppercase font-black tracking-widest text-zinc-700">Select a manifest entry to edit its frequency.</p>
                     </div>
                  </div>
                )}
             </AnimatePresence>

             {/* Admin Tips */}
             <div className="p-8 rounded-[2.5rem] border-red-900/20 bg-red-950/5 space-y-4">
                <div className="flex items-center gap-3 text-red-500">
                   <ShieldAlert className="w-4 h-4" />
                   <h4 className="text-xs uppercase font-black tracking-widest">Archivist Protocol</h4>
                </div>
                <ul className="space-y-2 text-[11px] text-zinc-500 font-serif italic">
                   <li>• Ensure audio files are hosted on Firebase Storage for CORS compatibility.</li>
                   <li>• 'Approved' status makes the chapter immediately audible to paid members.</li>
                   <li>• 'Draft' status is only visible to Owners and High Archivists.</li>
                   <li>• Replace placeholders with 48kHz Stereo MP3 for maximum immersion.</li>
                </ul>
             </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
