"use client";

import Link from "next/link";
import { X, Mail, ExternalLink } from "lucide-react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5-.73 1.02-1.08 2.25-1 3.5 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#050505] border-t border-white/5 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-16">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="space-y-2">
              <h3 className="font-serif text-2xl gold-gradient-text italic tracking-tighter">The Horror of Oz</h3>
              <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-black">Yellow Path Chronicles</p>
            </div>
            <p className="text-xs text-zinc-500 font-serif italic leading-relaxed">
              A cinematic dark fantasy card experience inspired by the nightmares of Oz.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-500 hover:text-primary transition-colors">
                <X className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-500 hover:text-primary transition-colors">
                <GithubIcon className="w-4 h-4" />
              </a>
              <a href="mailto:support@horrorofoz.com" className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-500 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav Columns */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] text-primary font-black">Chronicles</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic">The Dashboard</Link>
              <Link href="/campaign" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic">The Yellow Path</Link>
              <Link href="/cards" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic">The Vault</Link>
              <Link href="/library" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic">Forbidden Library</Link>
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] text-primary font-black">Exchange</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/marketplace" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic">Shards Bazaar</Link>
              <Link href="/trading" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic">Pathwalker Trades</Link>
              <Link href="/membership" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic">Membership</Link>
              <Link href="/journal" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic">Pathfinder's Journal</Link>
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] text-primary font-black">Sanctum</h4>
            <nav className="flex flex-col gap-3">
              <a href="/terms" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic flex items-center gap-2">Terms of Protocol <ExternalLink className="w-3 h-3" /></a>
              <a href="/privacy" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic flex items-center gap-2">Privacy of the Soul <ExternalLink className="w-3 h-3" /></a>
              <a href="/contact" className="text-xs text-zinc-500 hover:text-white transition-colors font-serif italic flex items-center gap-2">Contact Keeper <ExternalLink className="w-3 h-3" /></a>
            </nav>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <p className="text-[9px] uppercase tracking-widest text-zinc-700 font-black">
              Public Beta v1.0.4
            </p>
          </div>
          <p className="text-[9px] uppercase tracking-widest text-zinc-700 font-black text-center">
            &copy; {currentYear} The Horror of Oz: Yellow Path Chronicles. Created by Don E. Holmes III.
          </p>
          <div className="flex items-center gap-6">
             <p className="text-[9px] uppercase tracking-widest text-zinc-800 font-black">All Nightmares Reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
