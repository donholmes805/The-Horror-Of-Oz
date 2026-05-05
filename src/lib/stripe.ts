import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(stripeSecret, {
  apiVersion: "2026-04-22.dahlia" as any, // Using the required version for this SDK
  appInfo: {
    name: "The Horror of Oz",
    version: "0.1.0",
  },
});
