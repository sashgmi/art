import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { fundsReleasedVendor } from "@/lib/emails/templates";

// POST /api/stripe/release — Admin libère les fonds vers le vendeur
// Si le vendeur a Stripe Connect → Transfer automatique
// Sinon → retourne l'IBAN pour virement SEPA manuel
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { orderId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: { select: { id: true, title: true, titleAdmin: true } },
        buyer: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const AUTO_CONFIRM_DAYS = 10;
    const daysShipped = order.shippedAt
      ? Math.floor((Date.now() - order.shippedAt.getTime()) / 86400000)
      : null;
    const isAutoEligible =
      order.status === "SHIPPED" && daysShipped !== null && daysShipped >= AUTO_CONFIRM_DAYS;

    if (!["CONFIRMED", "DELIVERED", "PAYMENT_HELD"].includes(order.status) && !isAutoEligible) {
      return NextResponse.json(
        { error: `Impossible de libérer les fonds pour une commande en statut "${order.status}"` },
        { status: 400 }
      );
    }

    // Récupérer le profil vendeur (IBAN) et son statut Stripe Connect
    const [vendorProfile, vendor, vendorUser] = await Promise.all([
      prisma.vendorProfile.findUnique({
        where: { userId: order.vendorId },
        select: { iban: true, bicSwift: true, bankName: true },
      }),
      prisma.user.findUnique({
        where: { id: order.vendorId },
        select: { stripeAccountId: true, stripeOnboarded: true },
      }),
      prisma.user.findUnique({
        where: { id: order.vendorId },
        select: { email: true, name: true },
      }),
    ]);

    const vendorAmount = Number(order.vendorAmount);
    const vendorAmountCents = Math.round(vendorAmount * 100);

    let stripeTransferId: string | null = null;
    let releaseMethod = "MANUAL_IBAN";

    // Priorité : Stripe Connect si disponible
    if (vendor?.stripeAccountId && vendor?.stripeOnboarded) {
      const transfer = await stripe.transfers.create({
        amount: vendorAmountCents,
        currency: "eur",
        destination: vendor.stripeAccountId,
        description: `Commande ${orderId} — ${order.listing.titleAdmin ?? order.listing.title}`,
        metadata: { orderId, vendorId: order.vendorId },
      });
      stripeTransferId = transfer.id;
      releaseMethod = "STRIPE_TRANSFER";
    }

    // Mise à jour DB : marquer comme libéré + listing vendu + stats vendeur
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: "FUNDS_RELEASED",
          fundsReleasedAt: new Date(),
          fundsReleasedBy: session.user.id,
          ...(stripeTransferId ? { stripeTransferId } : {}),
        },
      }),
      prisma.listing.update({
        where: { id: order.listingId },
        data: { status: "SOLD" },
      }),
      prisma.vendorProfile.updateMany({
        where: { userId: order.vendorId },
        data: {
          totalSales: { increment: 1 },
          totalRevenue: { increment: order.vendorAmount },
        },
      }),
    ]);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "FUNDS_RELEASED",
        entity: "Order",
        entityId: orderId,
        metadata: {
          amount: vendorAmount,
          vendorId: order.vendorId,
          method: releaseMethod,
          ...(releaseMethod === "STRIPE_TRANSFER"
            ? { stripeTransferId, stripeAccountId: vendor?.stripeAccountId }
            : {
                iban: vendorProfile?.iban ?? null,
                bicSwift: vendorProfile?.bicSwift ?? null,
                bankName: vendorProfile?.bankName ?? null,
              }),
        },
      },
    });

    // Email vendeur
    if (vendorUser?.email) {
      const { subject, html } = fundsReleasedVendor({
        vendorName: vendorUser.name || "Vendeur",
        listingTitle: order.listing.titleAdmin ?? order.listing.title,
        vendorAmount,
        method: releaseMethod as "STRIPE_TRANSFER" | "MANUAL_IBAN",
        iban: vendorProfile?.iban ?? null,
      });
      sendEmail({ to: vendorUser.email, subject, html });
    }

    return NextResponse.json({
      success: true,
      amount: vendorAmount,
      method: releaseMethod,
      stripeTransferId,
      iban: releaseMethod === "MANUAL_IBAN" ? (vendorProfile?.iban ?? null) : null,
      bicSwift: releaseMethod === "MANUAL_IBAN" ? (vendorProfile?.bicSwift ?? null) : null,
      bankName: releaseMethod === "MANUAL_IBAN" ? (vendorProfile?.bankName ?? null) : null,
    });
  } catch (error) {
    console.error("Release error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la libération des fonds" },
      { status: 500 }
    );
  }
}
