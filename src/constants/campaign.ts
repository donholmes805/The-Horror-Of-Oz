export type NodeType = 
  | "Start"
  | "Encounter"
  | "Search"
  | "Story"
  | "LockedDoor"
  | "DangerPath"
  | "HiddenSearch"
  | "MiniBoss"
  | "Survival"
  | "SearchRest"
  | "StoryChoice"
  | "Hazard"
  | "StoryBattle"
  | "SafeCamp"
  | "StoryChallenge"
  | "FinalBoss"
  | "CampaignComplete"
  | "EncounterSearch";

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  section: number;
  description: string;
  connectedNodes: string[];
  eventId?: string;
  requirements?: {
    key?: string;
    stat?: { name: string; value: number };
    event?: string;
    OR?: { key?: string; stat?: { name: string; value: number }; event?: string }[];
    AND?: { key: string; items: number } | { key?: string; stat?: { name: string; value: number }; event?: string }[];
  };
  rewards?: {
    shards?: number;
    cardId?: string;
    badgeId?: string;
    stat?: { name: string; value: number };
  };
  x: number; // For map positioning
  y: number;
}

export const BOOK_I_NODES: Node[] = [
  // SECTION I
  { id: "book1_node_001", name: "Farmhouse Ruins", type: "Start", section: 1, description: "The storm has passed, but home is gone. Ash and splinters are all that remains of the Gale farm.", connectedNodes: ["book1_node_002"], x: 10, y: 50 },
  { id: "book1_node_002", name: "Ash Field", type: "Encounter", section: 1, description: "A grey wasteland where the crops once grew. Something moves beneath the soot.", connectedNodes: ["book1_node_001", "book1_node_003"], x: 20, y: 40 },
  { id: "book1_node_003", name: "Collapsed Oil Derrick", type: "Search", section: 1, description: "A rusted monument to the old world. Useful scraps might be hidden here.", connectedNodes: ["book1_node_002", "book1_node_004", "book1_node_005"], x: 30, y: 55 },
  { id: "book1_node_004", name: "Gallows Circle", type: "Story", section: 1, description: "A ring of hanging trees. The past lingers here in the creak of the ropes.", connectedNodes: ["book1_node_003", "book1_node_005"], x: 40, y: 45, eventId: "book1_story_rescue_thatch" },
  { id: "book1_node_005", name: "Marshal Patrol Road", type: "Encounter", section: 1, description: "The Tin Enforcers keep a close watch on this path. Move quietly.", connectedNodes: ["book1_node_003", "book1_node_004", "book1_node_006"], x: 50, y: 50 },
  { id: "book1_node_006", name: "Rebel Trail Gate", type: "LockedDoor", section: 1, description: "A heavy iron gate blocking the way to the City of Steel.", connectedNodes: ["book1_node_005", "book1_node_007"], x: 60, y: 40, requirements: { OR: [{ key: "rust-key" }, { event: "book1_story_rescue_thatch" }] } },
  
  // SECTION II
  { id: "book1_node_007", name: "Red Patrol Road", type: "DangerPath", section: 2, description: "A high-traffic route for the Marshal's scouts.", connectedNodes: ["book1_node_006", "book1_node_008", "book1_node_010"], x: 70, y: 55 },
  { id: "book1_node_008", name: "City of Steel Gate", type: "LockedDoor", section: 2, description: "The massive gears of the city gate loom overhead.", connectedNodes: ["book1_node_007", "book1_node_009"], x: 80, y: 45, requirements: { key: "steel-gate-key", stat: { name: "courage", value: 5 } } },
  { id: "book1_node_009", name: "Living Arches", type: "Story", section: 2, description: "Bio-mechanical flora that seems to breathe.", connectedNodes: ["book1_node_008", "book1_node_010", "book1_node_011"], x: 90, y: 50, eventId: "book1_story_living_arches" },
  { id: "book1_node_010", name: "Clockwork Yard", type: "EncounterSearch", section: 2, description: "A scrap heap of discarded machines.", connectedNodes: ["book1_node_007", "book1_node_009", "book1_node_012"], x: 100, y: 60 },
  { id: "book1_node_011", name: "Hidden Rebel Passage", type: "HiddenSearch", section: 2, description: "A narrow crawlspace marked with a faint resistance symbol.", connectedNodes: ["book1_node_009", "book1_node_012"], x: 110, y: 40, requirements: { stat: { name: "memory", value: 3 } } },
  { id: "book1_node_012", name: "Steel Watchtower", type: "MiniBoss", section: 2, description: "A sentinel that never sleeps.", connectedNodes: ["book1_node_010", "book1_node_011", "book1_node_013"], x: 120, y: 50, requirements: { stat: { name: "steel", value: 3 } } },

  // SECTION III
  { id: "book1_node_013", name: "Dunes of Despair", type: "Survival", section: 3, description: "Endless sands of pulverized gold.", connectedNodes: ["book1_node_012", "book1_node_014", "book1_node_015"], x: 130, y: 65 },
  { id: "book1_node_014", name: "Well of Scorch", type: "SearchRest", section: 3, description: "An oasis of boiling water.", connectedNodes: ["book1_node_013", "book1_node_016", "book1_node_017"], x: 140, y: 45 },
  { id: "book1_node_015", name: "Hounds of Argent Trail", type: "Encounter", section: 3, description: "The Marshal's hunting dogs are picking up your scent.", connectedNodes: ["book1_node_013", "book1_node_016"], x: 150, y: 55 },
  { id: "book1_node_016", name: "Memory of Kansas", type: "StoryChoice", section: 3, description: "A mirage or a ghost?", connectedNodes: ["book1_node_014", "book1_node_015", "book1_node_017"], x: 160, y: 40, eventId: "book1_story_memory_of_kansas" },
  { id: "book1_node_017", name: "Molten Oil Crossing", type: "Hazard", section: 3, description: "A river of burning fuel.", connectedNodes: ["book1_node_014", "book1_node_016", "book1_node_018"], x: 170, y: 50 },
  { id: "book1_node_018", name: "Forge Approach", type: "LockedDoor", section: 3, description: "The entrance to the Iron Maw.", connectedNodes: ["book1_node_017", "book1_node_019"], x: 180, y: 60, requirements: { AND: { key: "forge-key", items: 2 } } },

  // SECTION IV
  { id: "book1_node_019", name: "Iron Maw Outer Gate", type: "StoryBattle", section: 4, description: "The siege has begun.", connectedNodes: ["book1_node_018", "book1_node_020", "book1_node_021"], x: 190, y: 45, eventId: "book1_story_siege_begins" },
  { id: "book1_node_020", name: "Rebel Siege Line", type: "SafeCamp", section: 4, description: "A moment of respite.", connectedNodes: ["book1_node_019", "book1_node_021"], x: 200, y: 55 },
  { id: "book1_node_021", name: "Molten Forge Hall", type: "Encounter", section: 4, description: "The heart of the Marshal's production.", connectedNodes: ["book1_node_019", "book1_node_020", "book1_node_022"], x: 210, y: 40 },
  { id: "book1_node_022", name: "Core Furnace", type: "StoryChallenge", section: 4, description: "The engine of the Iron Maw.", connectedNodes: ["book1_node_021", "book1_node_023"], x: 220, y: 50 },
  { id: "book1_node_023", name: "Marshal's Duel Platform", type: "FinalBoss", section: 4, description: "Marshal Argent awaits.", connectedNodes: ["book1_node_022", "book1_node_024"], x: 230, y: 60 },
  { id: "book1_node_024", name: "Red-Stained Exit Path", type: "CampaignComplete", section: 4, description: "The forge falls.", connectedNodes: ["book1_node_023"], x: 240, y: 50 },
];

export interface Clue {
  id: string;
  title: string;
  book: number;
  campaign: string;
  nodeId: string;
  description: string;
  hintText: string;
  unlocksPath?: string;
  revealsRequirement?: string;
}

export const BOOK_I_CLUES: Record<string, Clue> = {
  "clue_rust_under_brick": {
    id: "clue_rust_under_brick",
    title: "Rust Under the Yellow Brick",
    book: 1,
    campaign: "red_country",
    nodeId: "book1_node_003",
    description: "A series of scratch marks near the derrick base reveals a hidden compartment.",
    hintText: "Old locks in Red Country rarely need gold. They need rust.",
    unlocksPath: "book1_node_006"
  },
  "clue_straw_knights_last_words": {
    id: "clue_straw_knights_last_words",
    title: "The Straw Knight’s Last Words",
    book: 1,
    campaign: "red_country",
    nodeId: "book1_node_004",
    description: "Carved into the wood of a dead tree are the final thoughts of a fallen scout.",
    hintText: "Not every rescue needs strength. Some require mercy.",
    revealsRequirement: "book1_story_rescue_thatch"
  },
  "clue_marshal_patrol_pattern": {
    id: "clue_marshal_patrol_pattern",
    title: "Marshal Patrol Pattern",
    book: 1,
    campaign: "red_country",
    nodeId: "book1_node_005",
    description: "A discarded logbook details the movement of the tin enforcers.",
    hintText: "The patrol circles back after every third bell. (Gives +1 to Evade)",
  },
  "clue_living_arches_whisper": {
    id: "clue_living_arches_whisper",
    title: "The Living Arches Whisper",
    book: 1,
    campaign: "red_country",
    nodeId: "book1_node_009",
    description: "The pulsing vines seem to form patterns when viewed from a distance.",
    hintText: "The path beneath the steel is hidden by memory.",
    unlocksPath: "book1_node_011"
  },
  "clue_furnace_weakness": {
    id: "clue_furnace_weakness",
    title: "Furnace Weakness",
    book: 1,
    campaign: "red_country",
    nodeId: "book1_node_022",
    description: "Schematics found in the foreman's office reveal a structural flaw.",
    hintText: "The Marshal’s law bends when the furnace heart is broken.",
  }
};

export interface SectionObjectives {
  id: string;
  title: string;
  tasks: {
    id: string;
    label: string;
    completed: boolean;
  }[];
}

export const CAMPAIGN_OBJECTIVES: Record<string, SectionObjectives> = {
  "section_1": {
    id: "section_1",
    title: "Escape Awakening in Ash",
    tasks: [
      { id: "visit_derrick", label: "Visit the Collapsed Oil Derrick", completed: false },
      { id: "search_relic", label: "Search for a key or useful relic", completed: false },
      { id: "reach_gallows", label: "Reach Gallows Circle", completed: false },
      { id: "rescue_thatch", label: "Rescue Sir Hollin Thatch", completed: false },
      { id: "survive_patrol", label: "Survive one Marshal Patrol", completed: false },
      { id: "unlock_gate", label: "Unlock Rebel Trail Gate", completed: false }
    ]
  }
};
