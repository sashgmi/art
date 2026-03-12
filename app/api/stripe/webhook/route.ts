import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { sendEmail } from "@/lib/email";
import { orderConfirmedBuyer, newSaleVendor } from "@/lib/emails/templates";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(payload, sig);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Payment succeeded ──────────────────────────────────
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await prisma.order.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            status: "PAYMENT_HELD",
            timeline: {
              push: {
                event: "PAYMENT_HELD",
                timestamp: new Date().toISOString(),
                note: "Paiement reçu, fonds en séquestre",
              },
            },
          },
        });

        // Emails buyer + vendor
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
          include: {
            listing: { select: { title: true, titleAdmin: true } },
            buyer: { select: { email: true, name: true } },
          },
        });
        if (order) {
          const listingTitle = order.listing.titleAdmin ?? order.listing.title;
          if (order.buyer?.email) {
            const { subject, html } = orderConfirmedBuyer({
              buyerName: order.buyer.name || "Client",
              listingTitle,
              orderId: order.id,
              total: Number(order.total),
            });
            sendEmail({ to: order.buyer.email, subject, html });
          }
          const vendor = await prisma.user.findUnique({
            where: { id: order.vendorId },
            select: { email: true, name: true },
          });
          if (vendor?.email) {
            const { subject, html } = newSaleVendor({
              vendorName: vendor.name || "Vendeur",
              listingTitle,
              orderId: order.id,
              vendorAmount: Number(order.vendorAmount),
            });
            sendEmail({ to: vendor.email, subject, html });
          }
        }

        console.log(`✅ Payment held for PaymentIntent: ${paymentIntent.id}`);
        break;
      }

      // ── Payment failed ─────────────────────────────────────
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (order) {
          await Promise.all([
            prisma.order.update({
              where: { id: order.id },
              data: { status: "CANCELLED" },
            }),
            prisma.listing.update({
              where: { id: order.listingId },
              data: { status: "LIVE" },
            }),
          ]);
        }

        console.log(`❌ Payment failed for PaymentIntent: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
