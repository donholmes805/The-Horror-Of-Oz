"use client";

import { Info } from "lucide-react";

export function BetaNotice() {
  return (
    <div className="w-full py-8 px-6 border-t border-white/5 bg-black/60 backdrop-blur-md mt-12 relative overflow-hidden group">
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 text-center md:text-left">
        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shrink-0 shadow-[0_0_15px_rgba(184,134,11,0.1)]">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-2 flex-1">
          <h4 className="text-[10px] font-serif uppercase tracking-[0.4em] text-primary font-black">Beta Chronicles Protocol</h4>
          <p className="text-[11px] text-zinc-500 leading-relaxed font-serif italic max-w-4xl">
            The Horror of Oz: Yellow Path Chronicles is currently in beta. Gameplay balance, card drops, marketplace rules, membership features, and reader rewards may change as the platform is tested and improved. Your progress and artifacts are guarded, but the rules of the Path are still being written by the Great Oracle.
          </p>
        </div>
      </div>
    </div>
  );
}
