"use client";

/**
 * Permanent Sound Effect System for The Horror of Oz: Yellow Path Chronicles.
 * Uses consistent, reusable sound assets from /public/sounds/
 */

type SfxName = 
  | 'ui-click'
  | 'map-move'
  | 'node-select'
  | 'locked-door'
  | 'door-unlock'
  | 'story-open'
  | 'story-choice'
  | 'success-chime'
  | 'failure-hit'
  | 'search-start'
  | 'reward-reveal'
  | 'card-earned'
  | 'key-found'
  | 'shard-gain'
  | 'combat-start'
  | 'slash'
  | 'enemy-hit'
  | 'player-hit'
  | 'boss-warning'
  | 'boss-phase'
  | 'quest-complete'
  | 'turn-end'
  | 'searching'
  | 'travel-dust';

const SFX_VOLUMES: Record<string, number> = {
  'ui-click': 0.25,
  'click': 0.25, // Alias
  'node-select': 0.25,
  'map-move': 0.35,
  'locked-door': 0.45,
  'door-unlock': 0.45,
  'story-open': 0.35,
  'ui-open': 0.35, // Alias
  'story-choice': 0.3,
  'success-chime': 0.45,
  'failure-hit': 0.45,
  'search-start': 0.35,
  'search': 0.35, // Alias
  'reward-reveal': 0.5,
  'loot': 0.5, // Alias
  'card-earned': 0.55,
  'key-found': 0.45,
  'shard-gain': 0.4,
  'combat-start': 0.5,
  'encounter': 0.5, // Alias
  'slash': 0.45,
  'enemy-hit': 0.5,
  'player-hit': 0.45,
  'boss-warning': 0.6,
  'boss-phase': 0.55,
  'quest-complete': 0.6,
  'turn-end': 0.3
};

// Map keys to actual files if they differ
const SFX_FILES: Record<string, string> = {
  'click': 'ui-click',
  'ui-open': 'story-open',
  'search': 'search-start',
  'loot': 'reward-reveal',
  'encounter': 'combat-start',
};


let soundEnabled = true;

if (typeof window !== "undefined") {
  const saved = localStorage.getItem("soundEnabled");
  if (saved !== null) soundEnabled = saved === "true";
}

export const getSoundEnabled = () => soundEnabled;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("soundEnabled", String(enabled));
  }
};

export const playSfx = (name: SfxName | string, overrideVolume?: number) => {
  if (!soundEnabled || typeof window === "undefined") return;

  try {
    const volume = overrideVolume ?? SFX_VOLUMES[name as string] ?? 0.4;
    const baseName = SFX_FILES[name as string] ?? name;
    // We use .ogg files as conversion to .mp3 was not available
    const audio = new Audio(`/sounds/${baseName}.ogg`);
    audio.volume = volume;
    audio.play().catch(() => {
      // Silently fail if blocked by browser or file missing
    });
  } catch (err) {
    // Graceful placeholder for missing assets
  }
};


export const stopAllSfx = () => {
  // Not strictly needed for simple SFX but good for cleanup if looping sounds added
};

export const preloadCommonSfx = () => {
  if (typeof window === "undefined") return;
  const common = ['ui-click', 'map-move', 'node-select'];
  common.forEach(name => {
    const baseName = SFX_FILES[name] ?? name;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'audio';
    link.href = `/sounds/${baseName}.ogg`;
    document.head.appendChild(link);
  });
};


