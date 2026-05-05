export interface Enemy {
  id: string;
  name: string;
  type: string;
  health: number;
  threat: number;
  description: string;
  weakness?: string;
  responses: { id: string; label: string; action: string }[];
  rewards: { shards?: number; fragments?: number; cardId?: string };
  failurePenalty?: string;
}

export const ENEMIES: Record<string, Enemy> = {
  "marshal_scout": {
    id: "marshal_scout",
    name: "Marshal Scout",
    type: "Construct",
    health: 2,
    threat: 1,
    description: "A metallic sentinel scouts the ash fields, eyes glowing with a cold, blue light.",
    weakness: "Electric / Rust",
    responses: [
      { id: "strike", label: "Brute Strike", action: "attack" },
      { id: "jam", label: "Jam Gears", action: "disable" }
    ],
    rewards: { shards: 10 }
  },
  "tin_patrol_unit": {
    id: "tin_patrol_unit",
    name: "Tin Patrol Unit",
    type: "Construct",
    health: 4,
    threat: 2,
    description: "Three rhythmic thuds announce the arrival of a standard patrol squad. Their axes are keen and clean.",
    weakness: "Joints / Oil Burn",
    responses: [
      { id: "strike", label: "Calculated Strike", action: "attack" },
      { id: "distract", label: "Flash Flare", action: "distract" }
    ],
    rewards: { shards: 25 }
  },
  "clockwork_sentinel": {
    id: "clockwork_sentinel",
    name: "Clockwork Sentinel",
    type: "Elite Construct",
    health: 6,
    threat: 3,
    description: "A towering mass of brass and steam. It does not speak, but the clicking of its gears is a death sentence.",
    weakness: "Main Spring",
    responses: [
      { id: "sabotage", label: "Core Sabotage", action: "skill" },
      { id: "heavy_strike", label: "Heavy Strike", action: "attack" }
    ],
    rewards: { shards: 50, fragments: 1 }
  },
  "hounds_of_argent": {
    id: "hounds_of_argent",
    name: "Hounds of Argent",
    type: "Pack",
    health: 5,
    threat: 2,
    description: "Metallic canines with jaws of serrated steel. They've picked up your scent.",
    weakness: "High Frequency",
    responses: [
      { id: "fend", label: "Fend Off", action: "defense" },
      { id: "fire", label: "Firebrand", action: "attack" }
    ],
    rewards: { shards: 30 }
  }
};

export const BOSSES: Record<string, any> = {
  "marshal_argent": {
    id: "marshal_argent",
    name: "Marshal Argent",
    title: "The Tin Marshal",
    description: "The commander of the Iron Maw. His armor is made of a thousand melted wedding rings, and his heart is a furnace of pure authority.",
    health: 15,
    threat: 5,
    phases: [
      { id: 1, name: "Law Without Mercy", requirement: "15 HP", description: "The Marshal tests your resolve with a barrage of logic and lead." },
      { id: 2, name: "Cavalry Reinforcement", requirement: "10 HP", description: "The Hounds are unleashed. The odds turn against you." },
      { id: 3, name: "Duel on Red-Stained Bricks", requirement: "5 HP", description: "A final stand atop the Core Furnace." }
    ],
    rewards: { shards: 250, cardId: "marshal-argent-commander" },
    failurePenalty: "Retreat to Rebel Siege Line, -3 Health"
  }
};
