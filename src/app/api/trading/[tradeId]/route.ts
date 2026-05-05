export const dynamic = "force-dynamic";
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request, { params }: { params: Promise<{ tradeId: string }> }) {
  try {
    const { action, userId } = await req.json();
    const { tradeId } = await params;

    const tradeRef = adminDb.collection("trades").doc(tradeId);
    const tradeSnap = await tradeRef.get();

    if (!tradeSnap.exists) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const trade = tradeSnap.data()!;

    if (trade.status !== "pending") {
      return NextResponse.json({ error: "Trade is no longer pending" }, { status: 400 });
    }

    if (action === "reject") {
      if (userId !== trade.receiverId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      await tradeRef.update({ status: "rejected", updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ success: true });
    }

    if (action === "cancel") {
      if (userId !== trade.senderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      await tradeRef.update({ status: "canceled", updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ success: true });
    }

    if (action === "accept") {
      if (userId !== trade.receiverId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

      // Atomic Swap Transaction
      await adminDb.runTransaction(async (transaction: any) => {
        // 1. Re-verify everything inside transaction
        const senderCards = [];
        for (const cardDocId of trade.senderOffer) {
          const ref = adminDb.collection("users").doc(trade.senderId).collection("playerCards").doc(cardDocId);
          const snap = await transaction.get(ref);
          if (!snap.exists || snap.data()?.marketStatus === "listed") throw new Error("Card no longer available");
          senderCards.push({ id: cardDocId, data: snap.data()! });
        }

        const receiverCards = [];
        for (const cardDocId of trade.receiverOffer) {
          const ref = adminDb.collection("users").doc(trade.receiverId).collection("playerCards").doc(cardDocId);
          const snap = await transaction.get(ref);
          if (!snap.exists || snap.data()?.marketStatus === "listed") throw new Error("Card no longer available");
          receiverCards.push({ id: cardDocId, data: snap.data()! });
        }

        // 2. Perform Swap
        // Move sender cards to receiver
        for (const card of senderCards) {
          const oldRef = adminDb.collection("users").doc(trade.senderId).collection("playerCards").doc(card.id);
          const newRef = adminDb.collection("users").doc(trade.receiverId).collection("playerCards").doc(card.id);
          transaction.set(newRef, { 
            ...card.data, 
            acquiredAt: FieldValue.serverTimestamp(),
            source: `trade_${tradeId}`,
            updatedAt: FieldValue.serverTimestamp()
          });
          transaction.delete(oldRef);
        }

        // Move receiver cards to sender
        for (const card of receiverCards) {
          const oldRef = adminDb.collection("users").doc(trade.receiverId).collection("playerCards").doc(card.id);
          const newRef = adminDb.collection("users").doc(trade.senderId).collection("playerCards").doc(card.id);
          transaction.set(newRef, { 
            ...card.data, 
            acquiredAt: FieldValue.serverTimestamp(),
            source: `trade_${tradeId}`,
            updatedAt: FieldValue.serverTimestamp()
          });
          transaction.delete(oldRef);
        }

        // 3. Update Trade Status
        transaction.update(tradeRef, { 
          status: "accepted", 
          updatedAt: FieldValue.serverTimestamp() 
        });

        // 4. Create Audit Logs (optional but recommended)
        const auditRef = adminDb.collection("auditLogs").doc();
        transaction.set(auditRef, {
          type: "trade_acceptance",
          tradeId,
          participants: [trade.senderId, trade.receiverId],
          timestamp: FieldValue.serverTimestamp()
        });
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Trade processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
