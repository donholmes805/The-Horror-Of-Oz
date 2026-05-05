export const dynamic = "force-dynamic";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const session = event.data.object as any;

  switch (event.type) {
    case "checkout.session.completed":
    case "invoice.payment_succeeded":
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if ("deleted" in subscription) {
          return NextResponse.json({ error: "Subscription deleted" }, { status: 400 });
        }

        const stripeSub = subscription as any;
        const userId = stripeSub.metadata?.userId || session.metadata?.userId;

        if (userId) {
          await adminDb.collection("users").doc(userId).update({
            membershipStatus: "paid",
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            membershipExpiresAt: new Date(stripeSub.current_period_end * 1000),
            billingStatus: "active",
            updatedAt: new Date(),
          });
        }
      }
      break;

    case "customer.subscription.deleted":
    case "customer.subscription.updated":
      const sub = event.data.object as Stripe.Subscription;
      const uid = sub.metadata.userId;

      if (uid) {
        const status = sub.status === "active" ? "paid" : "expired";
        await adminDb.collection("users").doc(uid).update({
          membershipStatus: status,
          billingStatus: sub.status,
          membershipExpiresAt: new Date((sub as any).current_period_end * 1000),
          updatedAt: new Date(),
        });
      }
      break;

    case "invoice.payment_failed":
      const inv = event.data.object as any;
      const uId = inv.subscription ? (await stripe.subscriptions.retrieve(inv.subscription as string)).metadata.userId : null;

      if (uId) {
        await adminDb.collection("users").doc(uId).update({
          billingStatus: "past_due",
          updatedAt: new Date(),
        });
      }
      break;
  }

  return NextResponse.json({ received: true });
}
