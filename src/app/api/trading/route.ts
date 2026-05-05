export const dynamic = "force-dynamic";
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { 
      senderId, 
      senderName, 
      receiverId, 
      receiverName, 
      senderOffer, 
      receiverOffer 
    } = await req.json();

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: "Missing participants" }, { status: 400 });
    }

    // 1. Verify Sender ownership and eligibility
    for (const cardDocId of senderOffer) {
      const cardRef = adminDb.collection("users").doc(senderId).collection("playerCards").doc(cardDocId);
      const cardSnap = await cardRef.get();
      if (!cardSnap.exists) throw new Error(`Card ${cardDocId} not found in sender inventory`);
      const cardData = cardSnap.data()!;
      if (cardData.bound || cardData.activeInCampaign || cardData.marketStatus === "listed") {
        throw new Error(`Card ${cardDocId} is not eligible for trading`);
      }
      if (cardData.tradeUnlockDate && cardData.tradeUnlockDate.toDate() > new Date()) {
        throw new Error(`Card ${cardDocId} is still trade-locked`);
      }
    }

    // 2. Verify Receiver ownership and eligibility
    for (const cardDocId of receiverOffer) {
      const cardRef = adminDb.collection("users").doc(receiverId).collection("playerCards").doc(cardDocId);
      const cardSnap = await cardRef.get();
      if (!cardSnap.exists) throw new Error(`Card ${cardDocId} not found in receiver inventory`);
      const cardData = cardSnap.data()!;
      if (cardData.bound || cardData.activeInCampaign || cardData.marketStatus === "listed") {
        throw new Error(`Card ${cardDocId} is not eligible for trading`);
      }
      if (cardData.tradeUnlockDate && cardData.tradeUnlockDate.toDate() > new Date()) {
        throw new Error(`Card ${cardDocId} is still trade-locked`);
      }
    }

    // 3. Create Trade Document
    const tradeRef = adminDb.collection("trades").doc();
    await tradeRef.set({
      senderId,
      senderName,
      receiverId,
      receiverName,
      senderOffer,
      receiverOffer,
      status: "pending",
      participants: [senderId, receiverId],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, tradeId: tradeRef.id });
  } catch (error: any) {
    console.error("Trade creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
