"use client";

import Link from "next/link";
import { 
  Play, 
  BookOpen, 
  Skull, 
  ChevronRight, 
  Lock, 
  Key, 
  EyeOff, 
  CheckCircle,
  Zap,
  Volume2,
  ArrowLeftRight,
  Store,
  ShieldCheck,
  Star,
  Info,
  Sparkles,
  ArrowRight,
  Map as MapIcon,
  Layers,
  Scroll
} from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const features = [
    {
      title: "Board-Driven Adventures",
      icon: <MapIcon className="w-6 h-6 text-amber-500" />,
      description: "Move through locked nodes, hidden paths, story choices, and boss encounters across the corrupted Yellow Path.",
      color: "from-amber-500/20 to-transparent",
      badge: "Book I Live"
    },
    {
      title: "Legendary Cards",
      icon: <Layers className="w-6 h-6 text-emerald-500" />,
      description: "Earn, collect, and trade digital cards tied to characters, relics, and horrors from the Forbidden Grimoires.",
      color: "from-emerald-500/20 to-transparent",
      badge: "60+ Cards"
    },
    {
      title: "Forbidden Library",
      icon: <BookOpen className="w-6 h-6 text-blue-500" />,
      description: "Unlock the full manuscript of the Horror of Oz series with advanced reader tools and progress tracking.",
      color: "from-blue-500/20 to-transparent",
      badge: "Paid Access"
    },
    {
      title: "Cinematic Audiobooks",
      icon: <Volume2 className="w-6 h-6 text-purple-500" />,
      description: "Immerse yourself in a full-cast narration. Listen chapter by chapter as the nightmare unfolds.",
      color: "from-purple-500/20 to-transparent",
      badge: "Stereo Audio"
    }
  ];

  const cardRarities = [
    { name: "Starter", color: "text-zinc-400", glow: "shadow-zinc-500/20" },
    { name: "Common", color: "text-zinc-100", glow: "shadow-zinc-100/10" },
    { name: "Rare", color: "text-blue-400", glow: "shadow-blue-500/20" },
    { name: "Epic", color: "text-purple-400", glow: "shadow-purple-500/30" },
    { name: "Legendary", color: "text-amber-400", glow: "shadow-amber-500/40" },
    { name: "Founder", color: "text-yellow-500", glow: "shadow-yellow-500/50" },
  ];

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden selection:bg-amber-500 selection:text-black">
      <Navbar />
      
      {/* Cinematic Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background Layers */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 2 }}
            className="w-full h-full"
          >
            <img 
              alt="Horror of Oz Background" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi44PQ9kzwTJERp0H0hZLb3h1wy_7uBTlixFYERq7UlBBGYZQZvHytLBmMAp54nWMzr2GgsiUntxPQDhn35VaylIP0rBOePcMY8Uhak12H7doRUgmHfRHREbjll4Odx9VUIe4qGpVk1pBGJjC2NKpPH8Jvv3KdNIF1l2pKI7Jsmjn206sx1LDrOO6E12xCh4mduZGs8tFU6NlDP6ryxRUP4jx-2wmJucHrgm1JPb6kJfQxdomR0j60WnvUijKcW0YBNPnnMmI82AZF"
            />
          </motion.div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_#000_80%)]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          
          {/* Animated Light Sources */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-amber-500/40" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-amber-500 font-bold">
                The Yellow Path Awaits
              </span>
              <div className="h-px w-8 bg-amber-500/40" />
            </div>

            <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-serif italic font-bold tracking-tighter leading-[0.85]">
              <span className="block text-white opacity-90 drop-shadow-2xl">Enter the</span>
              <span className="block gold-gradient-text drop-shadow-[0_0_50px_rgba(200,155,44,0.3)]">Horror of Oz</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto font-serif italic leading-relaxed pt-4">
              A dark fantasy collectible card universe and interactive storybook. <br className="hidden md:block" />
              Collect the legends. Walk the path. Survive the nightmare.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12"
          >
            <Link href="/signup" className="premium-button group px-12 py-5 text-sm flex items-center justify-center gap-3">
              <span>Start Your Journey</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/campaign" className="glass-panel hover:bg-white/5 px-12 py-5 text-sm flex items-center justify-center gap-3 text-zinc-400 hover:text-white transition-all border-white/10">
              <Skull className="w-4 h-4" />
              <span>Enter Red Country</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { label: "Book I", sub: "Campaign Live" },
              { label: "60+", sub: "Unique Artifacts" },
              { label: "Beta", sub: "Active Access" },
              { label: "P2P", sub: "Shard Exchange" }
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-xl font-serif italic text-white leading-none">{stat.label}</p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">{stat.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Animated Fog Component */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
          <div className="animated-fog bg-amber-500/5"></div>
        </div>
      </section>

      {/* Feature Section with Premium Grid */}
      <section className="relative py-32 md:py-48 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-24">
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3 text-amber-500/60">
              <Sparkles className="w-5 h-5" />
              <span className="text-[11px] uppercase tracking-[0.5em] font-bold">The Core Chronicles</span>
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif italic text-white leading-[0.9] tracking-tighter">
              A Multidimensional <br className="hidden md:block" />Horror Experience
            </h2>
          </div>
          <div className="max-w-xs space-y-4">
            <div className="h-px w-12 bg-amber-500/40" />
            <p className="text-zinc-500 text-lg font-serif italic leading-relaxed">
              "The yellow bricks are stained with history. Choose your tools wisely, Pathwalker."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group h-full"
            >
              <div className={cn(
                "glass-panel p-8 md:p-12 relative flex flex-col h-full min-h-[340px] transition-all duration-500 hover:border-amber-500/30 group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                "bg-gradient-to-br overflow-hidden rounded-[2rem]", 
                feature.color
              )}>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 opacity-[0.02] blur-3xl rounded-full -mr-16 -mt-16" />
                
                {/* Top Row: Icon and Badge */}
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-amber-500/20 transition-all duration-500 shadow-2xl">
                    {feature.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-500 px-4 py-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                    {feature.badge}
                  </span>
                </div>

                {/* Content Container */}
                <div className="space-y-6 relative z-10">
                  <h3 className="text-3xl md:text-4xl font-serif italic text-white group-hover:gold-gradient-text transition-all duration-300 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 text-lg leading-relaxed font-serif italic max-w-sm">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Action */}
                <div className="mt-auto pt-10 flex items-center gap-3 text-amber-500/60 text-[11px] uppercase tracking-[0.3em] font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 relative z-10">
                  Explore Feature <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visual Showcase (Big Image Card) */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-white/10 group shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUaHEhTgxR9amSf4Cf-0d4Ee-LUH9HBIXZ6EY8VKqu3V1tNGACgMKu-yINO3eIrSPwQ6EG82F9mG3BX5nKPcMxwcAYIhys1g7Xm9c36pJ-xz7UWMK0tjw5Swtg9vZFWkH3xOxTc-YIOpKANs8JGFHwlZTBf-RXziKi7GCtNHwDxRp41J9Dmm5n2gTV7HjLEZbBpJznVUUmqBoqHb94DHcJ_hfCGUIYA2acmJo4M5D7dzTWuaz44smEQtjX_uZVjjQVqALS0PqDUvcp"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-60"
              alt="Map Preview"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
            
            <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row justify-between items-end gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.4em] text-red-500 font-bold">Live Campaign</span>
                </div>
                <h2 className="text-4xl md:text-6xl text-white font-serif italic leading-none">Red Country: Volume I</h2>
                <p className="text-zinc-400 text-lg max-w-md font-serif italic">Witness the fall of Munchkinland. Explore 24 strategic nodes through the fog.</p>
              </div>
              <Link href="/campaign" className="premium-button px-10 py-5 text-[11px] flex items-center gap-3 group">
                Enter the Fog <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rarity Showcase with Glowing Cards */}
      <section className="py-40 px-6 bg-[radial-gradient(circle_at_50%_50%,_#111_0%,_#000_100%)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-5xl md:text-6xl font-serif italic text-white leading-tight gold-gradient-text">Artifacts of Power</h2>
            <p className="text-zinc-500 uppercase tracking-[0.4em] text-[10px] font-bold">The Rarity Hierarchy</p>
          </div>

          <div className="flex flex-wrap justify-center gap-10">
            {cardRarities.map((rarity, idx) => (
              <motion.div
                key={rarity.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -20, scale: 1.05 }}
                className="group relative w-48 h-72"
              >
                {/* Dynamic Glow */}
                <div className={cn(
                  "absolute -inset-2 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl",
                  rarity.glow
                )} />

                <div className="relative h-full rounded-2xl bg-zinc-950 border border-white/5 overflow-hidden flex flex-col items-center justify-center gap-4 transition-all duration-300 group-hover:border-white/20">
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrz5QGeohTASnuLoQMKLm4Sb0g2OSAZDbqPheQ9QI-VKDi8yOCyz_Wt6AD8hk63fzBRFagDdyiI17wdcMy-76-if2G6R9a8IpldAU3b3DNtt0wOhcOhsgUV9bjUZWc6BQUEyVv7psk20-G9dpK_Bxfo6-itXyCtgfmZ-YU9Qq6NeSJ7crXzg1N3lM0csHweAGmNZ1zvrM2A_JGop5gXztvoGygX8crvfh9zVXuO6cIWAq7DpsuJC1tQIFYWmGimEQKty9Y7EAzXgmE" alt="" className="w-full h-full object-cover" />
                  </div>
                  <Star className={cn("w-10 h-10 transition-transform duration-500 group-hover:scale-110", rarity.color)} />
                  <span className={cn("text-[10px] uppercase tracking-[0.3em] font-bold", rarity.color)}>{rarity.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership CTA Section */}
      <section className="py-40 px-6">
        <div className="max-w-6xl mx-auto relative overflow-hidden rounded-[3rem] glass-panel border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHZM-iphSOu-yFGeqgFrsnQTEBDO_T1ZzfFugkHf7APTdVLiOUuYXgzNI9v7c5GfTUkMyP2h7rYqHcd1CSNODSvv6GPyOBd75OSKVSsnflU3lp5n5famqgNsAe_hCGw0TbxlN06DhZA4wwkKrijr-WhTTTHyruqgWbgdfk1dC1MAlfyGuXoeyeQZfgJYUYDuy68HvUU7Gosxrok-A8o5aJ9Lj6nFRojaIro1Pyd5g5YEleGwnhMPj-e410icNSPHjQIpDcPbpHZUa_"
              className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-1000"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          </div>
          
          <div className="relative z-10 p-12 md:p-24 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-amber-500">
                <Scroll className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-[0.5em] font-bold">The Inner Order</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-serif italic text-white leading-[0.9]">
                Bind Your Soul <br />to the Path
              </h2>
              <p className="text-zinc-400 text-xl font-serif italic leading-relaxed">
                Unlock the complete chronicles, hearing every whisper and reading every secret. The curtain is thin, Pathwalker.
              </p>
              <Link href="/membership" className="premium-button group px-12 py-6 text-xs flex items-center justify-center gap-3 w-fit">
                <span>Join the Order of the Path</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: <BookOpen className="w-5 h-5" />, title: "The Forbidden Library", sub: "Complete access to all manuscripts" },
                { icon: <Volume2 className="w-5 h-5" />, title: "Audiobook Access", sub: "Immersive narration for all chapters" },
                { icon: <Star className="w-5 h-5" />, title: "Founder Artifacts", sub: "Priority access to legendary drops" },
                { icon: <ArrowLeftRight className="w-5 h-5" />, title: "Bazaar Privileges", sub: "Zero trade cooldowns & priority listings" },
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-5 p-6 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md group hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold uppercase tracking-widest leading-none mb-1">{benefit.title}</h4>
                    <p className="text-xs text-zinc-500 font-serif italic">{benefit.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modernized Footer */}
      <footer className="relative bg-zinc-950 border-t border-white/5 pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-32">
            <div className="space-y-8">
              <Link href="/" className="flex flex-col group">
                <span className="text-3xl font-serif italic font-bold gold-gradient-text transition-all duration-500">Horror of Oz</span>
                <span className="text-[9px] uppercase tracking-[0.5em] text-zinc-600 font-bold">Yellow Path Chronicles</span>
              </Link>
              <p className="text-sm text-zinc-500 leading-relaxed font-serif italic">
                A dark reimagining of the classic. Survive the path, collect the artifacts, and uncover the horror behind the emerald curtain.
              </p>
              <div className="flex gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-center hover:bg-amber-500/5">
                    <div className="w-1 h-1 rounded-full bg-zinc-600" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-10">
              <h6 className="text-white text-[10px] uppercase tracking-[0.4em] font-bold">The Journey</h6>
              <ul className="space-y-4">
                <li><Link href="/campaign" className="text-sm text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-medium">Adventure Maps</Link></li>
                <li><Link href="/cards" className="text-sm text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-medium">Artifact Vault</Link></li>
                <li><Link href="/marketplace" className="text-sm text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-medium">Shard Exchange</Link></li>
                <li><Link href="/library" className="text-sm text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-medium">Forbidden Lore</Link></li>
              </ul>
            </div>

            <div className="space-y-10">
              <h6 className="text-white text-[10px] uppercase tracking-[0.4em] font-bold">Legals</h6>
              <ul className="space-y-4">
                <li><Link href="/terms" className="text-sm text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-medium">Terms of Survival</Link></li>
                <li><Link href="/privacy" className="text-sm text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-medium">Privacy Grimoire</Link></li>
                <li><Link href="/marketplace-rules" className="text-sm text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-medium">Bazaar Ethics</Link></li>
              </ul>
            </div>

            <div className="space-y-10">
              <h6 className="text-white text-[10px] uppercase tracking-[0.4em] font-bold">Sanctuary Status</h6>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">All Gates Operational</span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Chronicles by</span>
                  <span className="text-sm text-amber-500 font-serif italic">Don E. Holmes III</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-700 font-bold">
              © 2026 The Horror of Oz Universe. The Emerald City is watching.
            </p>
            <div className="flex gap-10">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-amber-500" />
                V 1.0.4 - Production Beta
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

