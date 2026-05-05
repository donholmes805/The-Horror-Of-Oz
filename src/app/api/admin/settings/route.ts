export const dynamic = "force-dynamic";
import { getAdminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = getAdminDb();
    const settingsSnap = await db.collection("system").doc("settings").get();
    
    if (!settingsSnap.exists) {
      // Default settings
      const defaults = {
        marketplaceEnabled: true,
        tradingEnabled: true,
        cardRewardsEnabled: true,
        betaMode: true,
        maintenanceMode: false,
        announcementText: "Welcome to the Public Beta of The Horror of Oz: Yellow Path Chronicles.",
      };
      await db.collection("system").doc("settings").set(defaults);
      return NextResponse.json(defaults);
    }

    return NextResponse.json(settingsSnap.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { settings } = await req.json();
    const db = getAdminDb();
    
    await db.collection("system").doc("settings").update({
      ...settings,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
