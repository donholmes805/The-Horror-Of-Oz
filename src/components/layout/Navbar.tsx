"use client";

import Link from "next/link";
import { Bell, UserCircle, Shield, Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin = profile?.role === "admin" || profile?.role === "owner";

  const navLinks = [
    { name: "Journal", href: "/journal" },
    { name: "Campaign", href: "/campaign" },
    { name: "Vault", href: "/cards" },
    { name: "Library", href: "/library" },
    { name: "Bazaar", href: "/marketplace" },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-700 h-20 flex items-center px-6 md:px-12",
        isScrolled 
          ? "bg-black/40 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        <Link href="/" className="group flex flex-col relative">
          <span className="text-xl md:text-2xl font-serif italic font-bold gold-gradient-text transition-all duration-500 tracking-tight group-hover:brightness-125">
            The Horror of Oz
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-500 group-hover:text-amber-500/60 transition-colors">
              Yellow Path Chronicles
            </span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2 p-1.5 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={cn(
                "relative px-6 py-2 text-[10px] uppercase font-bold tracking-[0.2em] transition-all rounded-full overflow-hidden group",
                pathname === link.href ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <span className="relative z-10">{link.name}</span>
              {pathname === link.href && (
                <motion.div 
                  layoutId="nav-bg"
                  className="absolute inset-0 bg-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] border border-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          ))}
          {isAdmin && (
            <Link 
              href="/admin" 
              className={cn(
                "flex items-center gap-2 px-6 py-2 text-[10px] uppercase font-bold tracking-[0.2em] transition-all rounded-full border border-transparent hover:border-red-900/50 hover:bg-red-900/10",
                pathname.startsWith("/admin") ? "text-red-500" : "text-zinc-600"
              )}
            >
              <Shield className="w-3 h-3" /> Admin
            </Link>
          )}
        </nav>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <button className="relative p-2.5 glass-panel rounded-full border-white/5 hover:border-amber-500/30 transition-all group overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Bell className="w-4 h-4 text-zinc-500 group-hover:text-amber-500 transition-colors" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-amber-500 rounded-full border border-black shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            </button>
            
            {user ? (
              <Link 
                href="/dashboard" 
                className="flex items-center gap-3 p-1.5 glass-panel rounded-full border-white/5 hover:border-white/10 transition-all group bg-zinc-950/40"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-red-900/20 flex items-center justify-center border border-white/5 group-hover:border-amber-500/30 transition-all">
                  <UserCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="pr-3 hidden xl:block">
                  <p className="text-[10px] font-bold text-zinc-200 leading-none group-hover:text-white transition-colors">{profile?.username || "Pathwalker"}</p>
                  <p className="text-[7px] uppercase tracking-widest text-zinc-600 mt-1 font-bold group-hover:text-amber-500/60 transition-colors">{profile?.membershipStatus || "Free"}</p>
                </div>
              </Link>
            ) : (
              <Link href="/login" className="premium-button px-8 py-2.5 text-[10px] font-bold">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-amber-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl lg:hidden flex flex-col items-center justify-center p-8 gap-10"
          >
            <div className="absolute top-10 right-10">
               <button onClick={() => setMobileMenuOpen(false)} className="p-4 text-zinc-500"><X className="w-8 h-8" /></button>
            </div>

            <div className="flex flex-col items-center gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-3xl font-serif italic tracking-wider transition-all",
                    pathname === link.href ? "gold-gradient-text" : "text-zinc-600"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-serif italic text-red-900 tracking-wider"
                >
                  Admin Sanctum
                </Link>
              )}
            </div>

            <div className="w-20 h-px bg-white/5" />
            
            <Link 
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="premium-button w-full max-w-xs text-center py-5 text-sm"
            >
              Player Dashboard
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
