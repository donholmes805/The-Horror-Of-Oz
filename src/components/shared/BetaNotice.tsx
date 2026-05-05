"use client";

import { Info } from "lucide-react";

export function BetaNotice() {
  return (
    <div className="w-full py-6 px-4 border-t border-[#b8860b]/10 bg-black/40 backdrop-blur-sm mt-12">
      <div className="max-w-4xl mx-auto flex items-start gap-4">
        <div className="p-2 bg-primary/20 rounded-full shrink-0">
          <Info className="w-4 h-4 text-primary" />
        </div>
        <div className="space-y-1">
          <h4 className="text-[10px] font-serif uppercase tracking-widest text-primary font-bold">Beta Phase Protocol</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-tighter">
            The Horror of Oz: Yellow Path Chronicles is currently in public beta. Gameplay, card values, drop rates, marketplace rules, and membership features may be adjusted as the platform is tested and improved. Your feedback is vital to surviving the Yellow Path.
          </p>
        </div>
      </div>
    </div>
  );
}
