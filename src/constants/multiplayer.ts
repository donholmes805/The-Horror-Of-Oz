import { BotDefinition } from "@/types/multiplayer";

export const BOT_OPPONENTS: Record<string, BotDefinition> = {
  "marshal_scout_bot": {
    id: "marshal_scout_bot",
    name: "Marshal Scout Unit",
    type: "scout",
    difficulty: "easy",
    health: 8,
    attack: 3,
    defense: 2,
    abilities: ["Quick Strike"],
    description: "A nimble clockwork scout designed for rapid engagement and retreat."
  },
  "tin_patrol_bot": {
    id: "tin_patrol_bot",
    name: "Tin Patrol Guard",
    type: "patrol",
    difficulty: "medium",
    health: 12,
    attack: 4,
    defense: 4,
    abilities: ["Heavy Shield", "Ax Slam"],
    description: "A standard patrol unit with reinforced plating and a massive hydraulic ax."
  },
  "clockwork_sentinel_bot": {
    id: "clockwork_sentinel_bot",
    name: "Clockwork Sentinel",
    type: "sentinel",
    difficulty: "hard",
    health: 20,
    attack: 6,
    defense: 5,
    abilities: ["Overcharge", "Whirlwind"],
    description: "An advanced guardian with multiple limbs and a core that pulses with erratic energy."
  },
  "marshal_argent_bot": {
    id: "marshal_argent_bot",
    name: "Marshal Argent Alpha",
    type: "boss",
    difficulty: "legendary",
    health: 50,
    attack: 8,
    defense: 8,
    abilities: ["Command Strike", "System Shock", "Final Protocol"],
    description: "The peak of clockwork engineering. A merciless commander of the Red Country."
  }
};
