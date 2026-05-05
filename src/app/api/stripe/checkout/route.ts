import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userDoc.exists || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = userData.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await adminDb.collection("users").doc(userId).update({ stripeCustomerId: customerId });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Ensure this is set in .env
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/membership?canceled=true`,
      metadata: { userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
