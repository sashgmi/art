import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutPaymentIntent } from "@/lib/stripe";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const checkoutSchema = z.object({
  listingId: z.string(),
  shippingAddress: z.object({
    name: z.string(),
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string().default("FR"),
  }),
});

// POST /api/stripe/checkout — Initiate purchase and create PaymentIntent
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { listingId, shippingAddress } = checkoutSchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId, status: "LIVE" },
      include: {
        vendor: {
          select: { id: true, email: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Article introuvable ou indisponible" },
        { status: 404 }
      );
    }

    const price = Number(listing.priceAdmin || listing.price);
    const shipping = Number(listing.shippingCost || 0);

    const { paymentIntentId, clientSecret, fees } =
      await createCheckoutPaymentIntent({
        listingId: listing.id,
        orderId: "",
        buyerEmail: session.user.email!,
        priceEur: price,
        shippingEur: shipping,
        listingTitle: listing.titleAdmin || listing.title,
      });

    const order = await prisma.order.create({
      data: {
        buyerId: session.user.id,
        vendorId: listing.vendorId,
        listingId: listing.id,
        subtotal: price,
        platformFee: fees.platformFeeCents / 100,
        shippingCost: shipping,
        total: fees.totalCents / 100,
        vendorAmount: fees.vendorAmountCents / 100,
        currency: "EUR",
        stripePaymentIntentId: paymentIntentId,
        shippingAddress,
        status: OrderStatus.PENDING_PAYMENT,
      },
    });

    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: "RESERVED" },
    });

    return NextResponse.json({
      clientSecret,
      orderId: order.id,
      fees: {
        subtotal: price,
        platformFee: fees.platformFeeCents / 100,
        shipping,
        total: fees.totalCents / 100,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Erreur lors du paiement" }, { status: 500 });
  }
}
