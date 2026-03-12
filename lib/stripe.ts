import Stripe from "stripe";

// Lazy singleton — throws at call-time (not module-load) if env var is missing.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

// ── Platform fee ──────────────────────────────────────────────
export const PLATFORM_FEE_PERCENT = parseInt(
  process.env.STRIPE_PLATFORM_FEE_PERCENT || "15"
);

export function calculateFees(priceEur: number, shippingEur: number = 0) {
  const subtotal = Math.round(priceEur * 100);
  const shipping = Math.round(shippingEur * 100);
  const platformFee = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100));
  const total = subtotal + shipping;
  const vendorAmount = subtotal - platformFee;

  return {
    subtotalCents: subtotal,
    shippingCents: shipping,
    platformFeeCents: platformFee,
    totalCents: total,
    vendorAmountCents: vendorAmount,
  };
}

// ── Checkout / Payment Intent ─────────────────────────────────

/**
 * Create a PaymentIntent for a listing purchase.
 * Funds land on the platform account (escrow).
 * Vendor is paid via manual SEPA transfer when admin releases funds.
 */
export async function createCheckoutPaymentIntent(params: {
  listingId: string;
  orderId: string;
  buyerEmail: string;
  priceEur: number;
  shippingEur?: number;
  listingTitle: string;
}) {
  const fees = calculateFees(params.priceEur, params.shippingEur || 0);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: fees.totalCents,
    currency: "eur",
    receipt_email: params.buyerEmail,
    description: params.listingTitle,
    metadata: {
      listingId: params.listingId,
      orderId: params.orderId,
      vendorAmountCents: fees.vendorAmountCents.toString(),
    },
    automatic_payment_methods: { enabled: true },
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
    fees,
  };
}

// ── Refunds ───────────────────────────────────────────────────

export async function refundBuyer(params: {
  paymentIntentId: string;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}) {
  const refund = await stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    reason: params.reason || "requested_by_customer",
  });

  return refund;
}

// ── Webhook verification ──────────────────────────────────────

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
