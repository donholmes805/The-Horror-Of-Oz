"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 relative min-h-screen pt-20 pb-20 lg:pb-0">
        <div className="min-h-[calc(100vh-80px)]">
          {children}
        </div>
        <Footer />
      </main>
      <BottomNav />
    </div>
  );
}
