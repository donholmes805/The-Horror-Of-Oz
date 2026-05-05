"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Layers, // Cards
  BookOpen, 
  ArrowLeftRight, 
  Store, 
  ShieldCheck, 
  Settings, 
  HelpCircle,
  Trophy,
  Users,
  History,
  Share2,
  Lock
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Journal", href: "/journal", icon: History },
  { name: "Campaign", href: "/campaign", icon: MapIcon },
  { name: "Cards", href: "/cards", icon: Layers },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Trading", href: "/trading", icon: ArrowLeftRight },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "Affiliate", href: "/affiliate", icon: Share2 },
  { name: "Membership", href: "/membership", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, isOwner } = useAuth();

  const isAdmin = profile?.role === "admin" || isOwner;

  return (
    <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 pt-24 pb-8 bg-[#0a0a0a] w-64 border-r border-[#b8860b]/10 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-40">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full border border-[#b8860b]/30 overflow-hidden bg-muted">
          <img 
            alt="User portrait" 
            className="w-full h-full object-cover" 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'Felix'}`}
          />
        </div>
        <div>
          <p className="font-serif uppercase tracking-widest text-[10px] text-primary">{profile?.username || "Pathwalker"}</p>
          <p className="text-[10px] text-muted-foreground">Level {profile?.level || 1} | {profile?.shards || 0} Shards</p>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 font-serif uppercase tracking-widest text-xs transition-all duration-300",
                isActive 
                  ? "text-primary bg-primary/10 shadow-[inset_0_0_10px_rgba(184,134,11,0.2)] border-l-2 border-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 mt-auto pt-4 border-t border-[#b8860b]/10 space-y-1">
        {isAdmin && (
          <>
            <Link
              href="/admin/characters"
              className={cn(
                "flex items-center gap-3 px-4 py-3 font-serif uppercase tracking-widest text-xs transition-all duration-300",
                pathname.startsWith("/admin/characters") ? "text-primary bg-primary/10" : "text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/5"
              )}
            >
              <Users className="w-4 h-4" />
              Archives
            </Link>
            <Link
              href="/admin/affiliates"
              className={cn(
                "flex items-center gap-3 px-4 py-3 font-serif uppercase tracking-widest text-xs transition-all duration-300",
                pathname === "/admin/affiliates" ? "text-primary bg-primary/10" : "text-emerald-500/60 hover:text-emerald-500 hover:bg-emerald-500/5"
              )}
            >
              <Share2 className="w-4 h-4" />
              Network
            </Link>
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-4 py-3 font-serif uppercase tracking-widest text-xs transition-all duration-300",
                pathname === "/admin" ? "text-primary bg-primary/10" : "text-zinc-500/60 hover:text-zinc-400 hover:bg-white/5"
              )}
            >
              <Lock className="w-4 h-4" />
              Sanctum
            </Link>
          </>
        )}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted/50 hover:text-primary font-serif uppercase tracking-widest text-xs transition-all duration-300"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <Link
          href="/support"
          className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted/50 hover:text-primary font-serif uppercase tracking-widest text-xs transition-all duration-300"
        >
          <HelpCircle className="w-4 h-4" />
          Support
        </Link>
      </div>
    </aside>
  );
}
