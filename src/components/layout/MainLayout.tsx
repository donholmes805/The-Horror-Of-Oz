"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

import { cn } from "@/lib/utils";

export function MainLayout({ 
  children, 
  showFooter = true, 
  showNavbar = true,
  showSidebar = true,
  showBottomNav = true,
  fullHeight = false 
}: { 
  children: React.ReactNode;
  showFooter?: boolean;
  showNavbar?: boolean;
  showSidebar?: boolean;
  showBottomNav?: boolean;
  fullHeight?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {showNavbar && <Navbar />}
      {showSidebar && <Sidebar />}
      <main className={cn(
        showSidebar ? "lg:ml-64" : "ml-0",
        "relative transition-all duration-300",
        fullHeight ? "h-screen pt-0" : "min-h-screen pt-20 pb-20 lg:pb-0"
      )}>
        <div className={cn(
          "relative",
          fullHeight ? "h-full overflow-hidden" : "min-h-[calc(100vh-80px)]"
        )}>
          {children}
        </div>
        {showFooter && <Footer />}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
