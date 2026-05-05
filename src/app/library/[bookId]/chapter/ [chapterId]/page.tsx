"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { BOOKS } from "@/constants/library";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bookmark, Settings, ChevronLeft, ChevronRight, Lock, Volume2 } from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export default function ReaderPage() {
  const { bookId, chapterId } = useParams();
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState("text-lg");
  const [isBookmarked, setIsBookmarked] = useState(false);

  const book = BOOKS.find(b => b.bookId === bookId);
  const isPaid = profile?.membershipStatus === "paid" || profile?.membershipStatus === "admin" || profile?.membershipStatus === "owner";

  useEffect(() => {
    async function fetchChapter() {
      if (!bookId || !chapterId) return;
      
      // Fetch chapter content from Firestore
      const snap = await getDoc(doc(db, "books", bookId as string, "chapters", chapterId as string));
      if (snap.exists()) {
        setChapter(snap.data());
      } else {
        // Fallback for MVP if not seeded
        setChapter({
          title: "Sample Chapter",
          content: "The ash was everywhere. It filled her lungs and coated her skin in a fine, grey powder. Dorothy looked back at the ruins of her home, the farmhouse splintered like matchsticks by the force of the cyclone. But this was no Kansas storm. The air smelled of burnt oil and old magic. The path ahead was not gold, but a scorched, yellow brick road that bled red where the earth was broken...",
          previewText: "The ash was everywhere. It filled her lungs and coated her skin in a fine, grey powder..."
        });
      }
      setLoading(false);
    }
    fetchChapter();
  }, [bookId, chapterId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!user) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
    
    // Throttle progress updates in production
    if (percent % 5 === 0) {
      updateDoc(doc(db, "readerProgress", `${user.uid}_${bookId}`), {
        chapterId,
        scrollPercent: percent,
        updatedAt: serverTimestamp()
      });
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-serif italic text-primary">Opening the Tome...</div>;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0a0a0a] text-[#d1d1d1] selection:bg-primary/30">
        {/* Reader Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-sm font-serif italic text-white line-clamp-1">{book?.title}</h1>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{chapter?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setFontSize(fontSize === "text-lg" ? "text-xl" : "text-lg")} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={() => setIsBookmarked(!isBookmarked)} className={cn("p-2 transition-colors", isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          className="max-w-3xl mx-auto px-6 py-16 min-h-[120vh]"
          onScroll={handleScroll}
        >
          {!isPaid && chapter?.paidOnly !== false ? (
            <div className="text-center space-y-12 py-20">
              <div className="relative">
                <p className={cn("font-serif italic leading-relaxed opacity-20 blur-sm pointer-events-none select-none", fontSize)}>
                  {chapter?.content}
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="gothic-panel p-12 max-w-sm space-y-6 shadow-[0_0_50px_rgba(184,134,11,0.2)]">
                    <Lock className="w-12 h-12 text-primary mx-auto" />
                    <h3 className="text-2xl text-white font-serif italic">Access Restricted</h3>
                    <p className="text-sm text-muted-foreground">The full chronicles are reserved for members of the Order. Upgrade your status to continue the journey.</p>
                    <button className="w-full brass-button py-3 text-xs">Become a Member</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.article 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("font-serif italic leading-relaxed space-y-8 relative", fontSize)}
            >
              {/* Watermark */}
              <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none rotate-45">
                <p className="text-6xl font-bold uppercase tracking-widest">Licensed to {profile?.username || user?.email}</p>
              </div>

              {chapter?.content.split("\n\n").map((para: string, i: number) => (
                <p key={i} className="first-letter:text-4xl first-letter:text-primary first-letter:mr-1">
                  {para}
                </p>
              ))}

              <div className="pt-20 border-t border-primary/10 flex justify-between items-center">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs uppercase tracking-widest font-bold">
                  <ChevronLeft className="w-4 h-4" /> Previous Chapter
                </button>
                <button className="flex items-center gap-2 text-primary hover:text-white transition-colors text-xs uppercase tracking-widest font-bold">
                  Next Chapter <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-12 text-[10px] text-muted-foreground uppercase tracking-[0.5em]">
                © Don E. Holmes III. All Rights Reserved.
              </div>
            </motion.article>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
