"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, profile, logout } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: username,
        updatedAt: new Date()
      });
      setMessage({ type: "success", text: "Profile updated successfully in the archives." });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: `Error: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen p-8 max-w-5xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-primary text-xs uppercase font-black tracking-[0.3em]">
            <Settings className="w-4 h-4" /> System Configuration
          </div>
          <h1 className="text-5xl font-serif italic text-white">The Archivist's Dial</h1>
          <p className="text-zinc-500 max-w-2xl font-serif italic leading-relaxed">
            Adjust your presence within the Yellow Path. Every change resonates through the Great Archive.
          </p>
        </header>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-xl border flex items-center gap-3 backdrop-blur-md",
              message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
            )}
          >
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-serif italic">{message.text}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Navigation/Categories */}
          <aside className="space-y-2">
            {[
              { id: "profile", label: "Identity", icon: User, active: true },
              { id: "security", label: "Wards & Protection", icon: Shield },
              { id: "notifications", label: "Whispers", icon: Bell },
              { id: "appearance", label: "Visual Manifestation", icon: Eye },
            ].map((cat) => (
              <button
                key={cat.id}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 group",
                  cat.active 
                    ? "bg-primary/10 border border-primary/20 text-primary shadow-[0_0_20px_rgba(184,134,11,0.1)]" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                )}
              >
                <div className="flex items-center gap-4">
                  <cat.icon className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-black tracking-widest">{cat.label}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", cat.active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1")} />
              </button>
            ))}

            <div className="pt-8 mt-8 border-t border-white/5">
              <button 
                onClick={() => logout()}
                className="w-full flex items-center gap-4 p-4 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all group"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-widest">Abandon Session</span>
              </button>
            </div>
          </aside>

          {/* Settings Panel */}
          <main className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-zinc-950/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <User className="w-32 h-32 text-primary" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif italic text-white">Identity Registry</h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Your mark upon the chronicles</p>
                </div>

                <div className="space-y-6">
                  {/* Avatar Preview */}
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-full border-2 border-primary/30 p-1 relative group/avatar">
                      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border border-white/5">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'Felix'}`}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-2 bg-zinc-900 border border-primary/30 rounded-full text-primary shadow-lg group-hover/avatar:scale-110 transition-transform">
                        <Sparkles className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-serif italic">Manifestation Appearance</p>
                      <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Derived from your chosen name</p>
                    </div>
                  </div>

                  {/* Username Input */}
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase font-black tracking-widest text-zinc-500 ml-1">Pathname (Username)</label>
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your pathname..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white font-serif italic focus:outline-none focus:border-primary/50 transition-all placeholder:text-zinc-800"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase font-black tracking-widest text-zinc-500 ml-1">Archive Linked Email</label>
                    <div className="w-full bg-black/20 border border-white/5 rounded-xl px-6 py-4 text-zinc-600 font-mono text-sm flex items-center justify-between cursor-not-allowed">
                      {user?.email}
                      <Lock className="w-3 h-3" />
                    </div>
                    <p className="text-[8px] text-zinc-700 uppercase font-bold tracking-widest italic px-1">Email changes must be requested through the Sanctum.</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving || username === profile?.username}
                    className={cn(
                      "brass-button w-full flex items-center justify-center gap-3 py-4",
                      (isSaving || username === profile?.username) && "opacity-50 cursor-not-allowed grayscale"
                    )}
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Synchronizing..." : "Seal the Registry"}
                  </button>
                </div>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-zinc-950/40">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <h4 className="text-xl font-serif italic text-white">Membership Standing</h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-serif italic text-primary uppercase tracking-tighter">
                      {profile?.membershipStatus === 'paid' ? 'Eldritch Member' : profile?.role === 'owner' ? 'The Architect' : 'Frail Mortal'}
                    </p>
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em]">Current rank in the yellow country</p>
                  </div>
                </div>
                <Link href="/membership" className="text-[9px] uppercase font-black tracking-widest text-primary border-b border-primary/30 pb-1 hover:text-white hover:border-white transition-all">
                  Manage Access
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}

function Lock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
