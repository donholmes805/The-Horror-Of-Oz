import { db } from "./firebase";
import { doc, setDoc, serverTimestamp, collection, addDoc, getDoc } from "firebase/firestore";

export const OWNER_UID = "g8tHsefIBDfDz3k5nRv3NEZmh902";

export function isOwner(uid: string | undefined): boolean {
  return uid === OWNER_UID;
}

export async function initializeUser(uid: string, email: string | null, username: string | null, referredBy?: string) {
  const isUserOwner = isOwner(uid);
  
  // 1. Create user profile
  await setDoc(doc(db, "users", uid), {
    uid: uid,
    username: username || "Pathwalker",
    email: email,
    createdAt: serverTimestamp(),
    role: isUserOwner ? "owner" : "player",
    membershipStatus: isUserOwner ? "owner" : "free",
    membershipExpiresAt: null,
    level: isUserOwner ? 99 : 1,
    verified: isUserOwner ? true : false,
    yellowShards: isUserOwner ? 999999 : 0,
    referredByAffiliateCode: referredBy || null,
    referredByUserId: null, // Will be populated if code is valid
    referralCapturedAt: referredBy ? serverTimestamp() : null,
  });

  // 2. Create initial stats
  await setDoc(doc(db, "playerStats", uid), {
    userId: uid,
    health: isUserOwner ? 999 : 10,
    courage: isUserOwner ? 99 : 2,
    hope: isUserOwner ? 99 : 2,
    steel: isUserOwner ? 99 : 2,
    memory: isUserOwner ? 99 : 1,
  });

  // 3. Create initial progress
  await setDoc(doc(db, "playerProgress", uid), {
    userId: uid,
    campaignId: "book1_red_country",
    currentNode: "book1_node_001",
    completedNodes: [],
    visitedNodes: ["book1_node_001"],
    unlockedNodes: ["book1_node_001", "book1_node_002"],
    revealedNodes: ["book1_node_001", "book1_node_002", "book1_node_003", "book1_node_004", "book1_node_005", "book1_node_006"],
    actionPoints: isUserOwner ? 99 : 3,
    mapFragments: 0,
    inventoryKeys: [],
    keyItems: [],
    alliesUnlocked: [],
    allySupports: [],
    statusEffects: [],
    questProgress: {
      book1_quest_first_step: { status: "active", steps: [] }
    },
    completed: false,
    updatedAt: serverTimestamp(),
  });
}
