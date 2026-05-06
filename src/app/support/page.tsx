"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  ShieldQuestion, 
  Book,
  ExternalLink,
  ChevronRight,
  Send,
  Skull,
  Search
} from "lucide-react";

export default function SupportPage() {
  const [query, setQuery] = useState("");

  const faqs = [
    { q: "How do I regain lost Courage?", a: "Courage can be recovered by resting at certain safe nodes or by consuming rare Heart Elixirs found in hidden sectors." },
    { q: "What happens if my Hope reaches zero?", a: "Total despair leads to the 'Desolate Walk'. You will be returned to the last safe country and lose any unbanked shards." },
    { q: "Are the cards permanent?", a: "Yes, once unearthed and claimed, cards are tied to your soul (account) forever, unless traded in the marketplace." },
    { q: "How do I access the Forbidden Library?", a: "Access requires an Eldritch Membership or the explicit blessing of the Architect." }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen p-8 max-w-5xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-primary text-xs uppercase font-black tracking-[0.3em]">
            <HelpCircle className="w-4 h-4" /> Guidance Bureau
          </div>
          <h1 className="text-5xl font-serif italic text-white">Whispers of the Wise</h1>
          <p className="text-zinc-500 max-w-2xl font-serif italic leading-relaxed">
            Seek answers to the riddles of the Yellow Path. Our archivists are always listening to the void.
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask the archives..."
            className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl px-16 py-6 text-xl text-white font-serif italic focus:outline-none focus:border-primary/30 transition-all placeholder:text-zinc-800"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-serif italic text-white flex items-center gap-3">
              <ShieldQuestion className="w-6 h-6 text-primary" /> Common Inquiries
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="glass-panel p-6 rounded-2xl border-white/5 bg-zinc-900/20 space-y-3 group hover:border-primary/20 transition-all">
                  <h4 className="text-white font-serif italic text-lg">{faq.q}</h4>
                  <p className="text-sm text-zinc-500 font-serif italic leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact & Resources */}
          <section className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-serif italic text-white flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-primary" /> Reach the Sanctum
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                <a href="mailto:support@horrorofoz.com" className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white font-serif italic text-lg">Send a Raven</p>
                      <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Email Support</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </a>

                <button className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white font-serif italic text-lg">Live Communion</p>
                      <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">Discord Community</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-zinc-950/40 relative overflow-hidden">
              <Skull className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5" />
              <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-serif italic text-white">The Explorer's Codex</h3>
                <p className="text-sm text-zinc-500 font-serif italic leading-relaxed">
                  Deep dive into the mechanics of Oz. Learn about combat, stats, and the economy.
                </p>
                <button className="flex items-center gap-2 text-primary text-[10px] uppercase font-black tracking-widest group">
                  Open Wiki <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
