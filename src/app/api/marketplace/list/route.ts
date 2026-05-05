export const dynamic = "force-dynamic";
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { userId, cardDocId, price } = await req.json();

    if (!userId || !cardDocId || !price) {
      return NextResponse.json({ error: "Missing listing details" }, { status: 400 });
    }

    if (price < 1) {
      return NextResponse.json({ error: "Price must be at least 1 Shard" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const cardRef = userRef.collection("playerCards").doc(cardDocId);
    const cardSnap = await cardRef.get();

    if (!cardSnap.exists) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const cardData = cardSnap.data()!;

    // 1. Eligibility Checks
    if (cardData.bound) throw new Error("Bound cards cannot be sold");
    if (cardData.activeInCampaign) throw new Error("Card is active in a campaign");
    if (cardData.marketStatus === "listed") throw new Error("Card is already listed");
    
    // Sale lock check
    if (cardData.saleUnlockDate && cardData.saleUnlockDate.toDate() > new Date()) {
      throw new Error("Card is still sale-locked");
    }

    // 2. Atomically List Card
    const listingRef = adminDb.collection("marketplace").doc();
    
    await adminDb.runTransaction(async (transaction: any) => {
      // Mark card as listed
      transaction.update(cardRef, { 
        marketStatus: "listed", 
        listingId: listingRef.id,
        updatedAt: FieldValue.serverTimestamp() 
      });

      // Create listing
      transaction.set(listingRef, {
        sellerId: userId,
        sellerName: userSnap.data()?.username || "Pathwalker",
        cardId: cardData.cardId, // Master card ID
        cardDocId: cardDocId,   // Specific doc ID
        price: price,
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true, listingId: listingRef.id });
  } catch (error: any) {
    console.error("Listing error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
