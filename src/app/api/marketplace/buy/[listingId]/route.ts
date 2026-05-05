export const dynamic = "force-dynamic";
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request, { params }: { params: Promise<{ listingId: string }> }) {
  try {
    const { userId } = await req.json();
    const { listingId } = await params;

    const buyerRef = adminDb.collection("users").doc(userId);
    const listingRef = adminDb.collection("marketplace").doc(listingId);

    await adminDb.runTransaction(async (transaction: any) => {
      const buyerSnap = await transaction.get(buyerRef);
      const listingSnap = await transaction.get(listingRef);

      if (!buyerSnap.exists || !listingSnap.exists) {
        throw new Error("Invalid buyer or listing");
      }

      const buyerData = buyerSnap.data()!;
      const listingData = listingSnap.data()!;

      if (listingData.status !== "active") {
        throw new Error("Listing is no longer active");
      }

      if (listingData.sellerId === userId) {
        throw new Error("You cannot buy your own listing");
      }

      if (buyerData.yellowShards < listingData.price) {
        throw new Error("Insufficient Yellow Shards");
      }

      const sellerRef = adminDb.collection("users").doc(listingData.sellerId);
      const cardRef = sellerRef.collection("playerCards").doc(listingData.cardDocId);
      const cardSnap = await transaction.get(cardRef);

      if (!cardSnap.exists) {
        throw new Error("Card data not found");
      }

      const cardData = cardSnap.data()!;
      const fee = Math.floor(listingData.price * 0.075);
      const sellerProceeds = listingData.price - fee;

      // 1. Transfer Shards
      transaction.update(buyerRef, { yellowShards: FieldValue.increment(-listingData.price) });
      transaction.update(sellerRef, { yellowShards: FieldValue.increment(sellerProceeds) });

      // 2. Transfer Card
      const newCardRef = buyerRef.collection("playerCards").doc(listingData.cardDocId);
      transaction.set(newCardRef, {
        ...cardData,
        marketStatus: "active",
        acquiredAt: FieldValue.serverTimestamp(),
        source: "marketplace",
        updatedAt: FieldValue.serverTimestamp()
      });
      transaction.delete(cardRef);

      // 3. Mark Sold & Create Transaction Record
      transaction.update(listingRef, { status: "sold", updatedAt: FieldValue.serverTimestamp() });
      
      const txRef = adminDb.collection("transactions").doc();
      transaction.set(txRef, {
        type: "marketplace_purchase",
        listingId,
        buyerId: userId,
        sellerId: listingData.sellerId,
        price: listingData.price,
        fee,
        cardId: listingData.cardId,
        timestamp: FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
