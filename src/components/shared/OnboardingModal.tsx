"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Map as MapIcon, 
  Zap, 
  Lock, 
  Layers, 
  BookOpen, 
  ChevronRight, 
  X,
  Compass,
  Sword,
  ShieldCheck,
  History
} from "lucide-react";
import { useState } from "react";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

const steps: Step[] = [
  {
    title: "Welcome to the Path",
    description: "You have entered a dying Oz. Survival is not guaranteed, and every artifact has a price.",
    icon: <History className="w-10 h-10 text-primary" />,
    details: [
      "You do not receive a card at signup.",
      "Your first card is earned by completing your first quest.",
      "Every step you take writes your entry in the Journal."
    ]
  },
  {
    title: "The First Step",
    description: "Your journey begins in Book I: Blood on the Yellow Brick — Red Country.",
    icon: <MapIcon className="w-10 h-10 text-primary" />,
    details: [
      "Use Action Points (AP) to move, search, and interact.",
      "Locked doors require keys, stats, or completed story events.",
      "End your turn to refresh your Action Points."
    ]
  },
  {
    title: "Artifacts & The Vault",
    description: "Claimed relics are bound to your soul, but some can be traded or sold.",
    icon: <Layers className="w-10 h-10 text-primary" />,
    details: [
      "Starter Earned Cards cannot be traded for 14 days.",
      "Sales are locked for 90 days on starter artifacts.",
      "Soulbound items can never leave your collection."
    ]
  },
  {
    title: "The Forbidden Library",
    description: "Unlock the chronicles behind the nightmares.",
    icon: <BookOpen className="w-10 h-10 text-primary" />,
    details: [
      "Free users can preview the archive.",
      "Paid members unlock full books and audiobook chapters.",
      "Your reading and listening progress is saved automatically."
    ]
  }
];

export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl glass-panel rounded-[3rem] border-white/10 bg-black/60 shadow-2xl overflow-hidden p-8 md:p-12"
          >
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-6 rounded-3xl bg-zinc-950 border border-primary/20 shadow-[0_0_50px_rgba(184,134,11,0.1)]">
                  {steps[currentStep].icon}
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-5xl font-serif italic gold-gradient-text leading-tight">{steps[currentStep].title}</h2>
                  <p className="text-zinc-400 font-serif italic text-lg">{steps[currentStep].description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {steps[currentStep].details.map((detail, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5"
                  >
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-zinc-300 font-serif italic leading-relaxed">{detail}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                <div className="flex gap-2">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? "w-8 bg-primary" : "w-2 bg-white/10"}`} 
                    />
                  ))}
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <button 
                    onClick={onClose}
                    className="text-xs text-zinc-600 hover:text-white uppercase tracking-widest font-black transition-colors px-6 py-4"
                  >
                    Skip
                  </button>
                  <button 
                    onClick={nextStep}
                    className="premium-button flex-1 md:flex-none px-12 py-5 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                  >
                    {currentStep === steps.length - 1 ? "Begin the Yellow Path" : "Continue Ritual"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
