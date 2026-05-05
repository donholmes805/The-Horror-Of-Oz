"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Navbar } from "./Navbar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 relative min-h-screen pt-20 pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
