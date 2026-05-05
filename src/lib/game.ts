import { db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc, arrayUnion, increment, serverTimestamp } from "firebase/firestore";

export const QUEST_FIRST_STEP = "book1_quest_first_step";

export const STARTER_CARD_POOL = [
  "dot-gale-ashbound",
  "rust-key",
  "oil-derrick-refuge",
  "broken-dagger",
  "yellow-brick-fragment"
];

export async function checkQuestCompletion(userId: string) {
  const progressDoc = await getDoc(doc(db, "playerProgress", userId));
  if (!progressDoc.exists()) return;
  
  const progress = progressDoc.data();
  const quest = progress.questProgress?.[QUEST_FIRST_STEP];

  if (quest && quest.status === "active") {
    // Requirements:
    // - visit Gallows Circle (book1_node_004)
    // - complete Rescue Sir Hollin Thatch (step: rescue_thatch)
    // - survive one Marshal encounter (step: survive_encounter)
    // - unlock Rebel Trail Gate (completedNodes contains book1_node_006)
    
    const hasVisitedGallows = progress.visitedNodes.includes("book1_node_004");
    const hasRescuedThatch = quest.steps.includes("rescue_thatch");
    const hasSurvivedEncounter = quest.steps.includes("survive_encounter");
    const hasUnlockedGate = progress.completedNodes.includes("book1_node_006");

    if (hasVisitedGallows && hasRescuedThatch && hasSurvivedEncounter && hasUnlockedGate) {
      return await completeTutorialQuest(userId);
    }
  }
}

async function completeTutorialQuest(userId: string) {
  const progressRef = doc(db, "playerProgress", userId);
  const userRef = doc(db, "users", userId);

  // Mark quest complete
  await updateDoc(progressRef, {
    [`questProgress.${QUEST_FIRST_STEP}.status`]: "completed",
    [`questProgress.${QUEST_FIRST_STEP}.completedAt`]: serverTimestamp()
  });

  // Grant Shards
  await updateDoc(userRef, {
    yellowShards: increment(25)
  });

  // Grant Random Starter Card
  const cardId = STARTER_CARD_POOL[Math.floor(Math.random() * STARTER_CARD_POOL.length)];
  await grantStarterCard(userId, cardId);

  return {
    shards: 25,
    cardId,
    badgeId: "first-step"
  };
}

async function grantStarterCard(userId: string, cardId: string) {
  const acquiredAt = new Date();
  const tradeUnlock = new Date(acquiredAt.getTime() + (14 * 24 * 60 * 60 * 1000));
  const saleUnlock = new Date(acquiredAt.getTime() + (90 * 24 * 60 * 60 * 1000));

  const cardRef = doc(db, "users", userId, "playerCards", `${cardId}_starter`);
  
  // Claim once check
  const existing = await getDoc(cardRef);
  if (existing.exists()) return;

  await setDoc(cardRef, {
    cardId,
    acquiredAt: serverTimestamp(),
    source: "starter_quest",
    tradeUnlockDate: tradeUnlock,
    saleUnlockDate: saleUnlock,
    marketStatus: "starter_sale_locked",
    tradeable: false,
    sellable: false,
    bound: false,
    label: "Starter Earned — Sale Locked"
  });
}
