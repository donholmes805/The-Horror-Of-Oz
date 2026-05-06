"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  BookOpen, 
  Store 
} from "lucide-react";

const mobileItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaign", href: "/campaign", icon: MapIcon },
  { name: "Cards", href: "/cards", icon: BookOpen },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Market", href: "/marketplace", icon: Store },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 pb-safe bg-[#0a0a0a]/95 backdrop-blur-md border-t border-secondary/30 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] z-50">
      {mobileItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-200 active:scale-90",
              isActive 
                ? "text-primary drop-shadow-[0_0_10px_rgba(184,134,11,0.8)]" 
                : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-serif text-[10px] uppercase mt-1">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
