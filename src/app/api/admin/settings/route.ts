export const dynamic = "force-dynamic";
import { getAdminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = getAdminDb();
    
    // Default settings to return if DB is unavailable or doc missing
    const defaults = {
      marketplaceEnabled: true,
      tradingEnabled: true,
      cardRewardsEnabled: true,
      betaMode: true,
      maintenanceMode: false,
      announcementText: "Welcome to the Public Beta of The Horror of Oz: Yellow Path Chronicles.",
    };

    if (!db) {
      console.warn("Admin SDK not initialized. Returning default settings.");
      return NextResponse.json(defaults);
    }

    const settingsSnap = await db.collection("system").doc("settings").get();
    
    if (!settingsSnap.exists) {
      await db.collection("system").doc("settings").set(defaults);
      return NextResponse.json(defaults);
    }

    return NextResponse.json(settingsSnap.data());
  } catch (error: any) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { settings } = await req.json();
    const db = getAdminDb();
    
    if (!db) {
      return NextResponse.json({ error: "Admin SDK not initialized. Cannot update settings." }, { status: 503 });
    }
    
    await db.collection("system").doc("settings").update({
      ...settings,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
