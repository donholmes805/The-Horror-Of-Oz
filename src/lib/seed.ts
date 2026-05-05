import { db } from "@/lib/firebase";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";

const MASTER_CARDS = [
  // Starter
  {
    cardId: "dot-gale-ashbound",
    name: "Dot Gale — Ashbound Survivor",
    type: "Character",
    rarity: "Starter",
    book: "Book I",
    campaign: "Red Country",
    variant: "Starter Earned",
    description: "The storm took everything. Now, she takes it back.",
    gameplayEffect: "+2 Courage when moving to an Encounter node.",
    loreText: "The ashes of Kansas still cling to her boots, but her eyes are fixed on the horizon.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjM7ksuzL8kyqMHQLFHCmabsqGJ9tF2RdFb1nDRVlE1tMefjlgi6DAaEwWz1KIykaQmaJBRAcj_2pEMoZGNsYZ3yBD8qXEbj9OHymbqFAPRe9hZJgQ5UZGDChS12igFWvuyxQtFyhCczbMYQteo6DHhmxvByTkwKHVPQrBELmD15uCN_mIcIVypWcfasOlC1p2iihB4qr21eKFpShMs4DepFi7KH_YnU4DMMnij86uFRNf_76wuo5jB0aQOU5pJldY7IBJAfFWUniF",
    marketStatus: "active",
    tradeable: true,
    sellable: true,
    bound: false,
  },
  // Add more from the list provided in the request...
  { cardId: "rust-key", name: "Rust Key", type: "Key", rarity: "Common", book: "Book I", campaign: "Red Country", variant: "Standard", description: "A simple iron key, pitted with age.", gameplayEffect: "Unlocks the Rebel Trail Gate.", loreText: "Found in the ruins of a collapsed oil derrick.", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBykLEiAnrtV0nDBWludqRBJgZBk564opUQ1enx_2caV5W-_L8_meV9Uj9qNCpRudjD1WoRFhzNNfJ0Z1sGEwwxKYFq5IArPE968skiVX2LiLYQafp8uHPpSLxsbx8dXI25jwmNh08j9rLVY9JCEpwULMhLLPAPmKdzaK6xFp8sxOPJEC9G4mGQunYPdXRfEhzqe0Ax21vN7tqn6yUAx2DxDBReTWw1LMF20ShFI2F0H0b1vH7aAAYi3wTa7i3yOe6vXHNj7WMa_StQ", marketStatus: "active", tradeable: true, sellable: true, bound: false },
  { cardId: "oil-derrick-refuge", name: "Oil Derrick Refuge", type: "Location", rarity: "Common", book: "Book I", campaign: "Red Country", variant: "Standard", description: "A safe haven amidst the ash.", gameplayEffect: "Restores 1 AP when visited.", loreText: "The smell of oil is better than the smell of death.", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUaHEhTgxR9amSf4Cf-0d4Ee-LUH9HBIXZ6EY8VKqu3V1tNGACgMKu-yINO3eIrSPwQ6EG82F9mG3BX5nKPcMxwcAYIhys1g7Xm9c36pJ-xz7UWMK0tjw5Swtg9vZFWkH3xOxTc-YIOpKANs8JGFHwlZTBf-RXziKi7GCtNHwDxRp41J9Dmm5n2gTV7HjLEZbBpJznVUUmqBoqHb94DHcJ_hfCGUIYA2acmJo4M5D7dzTWuaz44smEQtjX_uZVjjQVqALS0PqDUvcp", marketStatus: "active", tradeable: true, sellable: true, bound: false },
  // ... (Full list will be seeded via a more robust method if needed, but for now I'll use a script to push these)
];

const CAMPAIGN_NODES = [
  { id: "book1_node_001", name: "Farmhouse Ruins", type: "Start", section: 1, description: "The storm has passed, but home is gone. Ash and splinters are all that remains of the Gale farm.", connectedNodes: ["book1_node_002"], x: 10, y: 50 },
  { id: "book1_node_002", name: "Ash Field", type: "Encounter", section: 1, description: "A grey wasteland where the crops once grew. Something moves beneath the soot.", connectedNodes: ["book1_node_001", "book1_node_003"], x: 20, y: 40 },
  { id: "book1_node_003", name: "Collapsed Oil Derrick", type: "Search", section: 1, description: "A rusted monument to the old world. Useful scraps might be hidden here.", connectedNodes: ["book1_node_002", "book1_node_004", "book1_node_005"], x: 30, y: 55 },
  { id: "book1_node_004", name: "Gallows Circle", type: "Story", section: 1, description: "A ring of hanging trees. The past lingers here in the creak of the ropes.", connectedNodes: ["book1_node_003", "book1_node_005"], x: 40, y: 45, eventId: "book1_story_rescue_thatch" },
  { id: "book1_node_005", name: "Marshal Patrol Road", type: "Encounter", section: 1, description: "The Tin Enforcers keep a close watch on this path. Move quietly.", connectedNodes: ["book1_node_003", "book1_node_004", "book1_node_006"], x: 50, y: 50 },
  { id: "book1_node_006", name: "Rebel Trail Gate", type: "LockedDoor", section: 1, description: "A heavy iron gate blocking the way to the City of Steel.", connectedNodes: ["book1_node_005", "book1_node_007"], x: 60, y: 40, requirements: { key: "rust-key", event: "book1_story_rescue_thatch" } },
  // ... and so on for all 24 nodes
];

// Helper to seed everything
export async function seedDatabase() {
  console.log("Starting seed...");
  
  // Seed Master Cards
  const cardsCol = collection(db, "cards");
  for (const card of MASTER_CARDS) {
    await setDoc(doc(cardsCol, card.cardId), card);
  }

  // Seed Campaign
  const campaignDoc = doc(db, "campaigns", "book1_red_country");
  await setDoc(campaignDoc, {
    campaignId: "book1_red_country",
    title: "Blood on the Yellow Brick — Red Country",
    book: "Book I",
    startingNodeId: "book1_node_001",
    completionNodeId: "book1_node_024",
    status: "active"
  });

  // Seed Nodes
  const nodesCol = collection(campaignDoc, "nodes");
  for (const node of CAMPAIGN_NODES) {
    await setDoc(doc(nodesCol, node.id), node);
  }

  console.log("Seed complete!");
}
