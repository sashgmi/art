import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { orderShippedBuyer } from "@/lib/emails/templates";

const shipSchema = z.object({
  trackingNumber: z.string().min(3).max(100),
  trackingCarrier: z.string().max(50).optional(),
});

// PATCH /api/orders/[id]/ship — Vendeur marque la commande comme expédiée
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || !["VENDOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true, titleAdmin: true } },
      buyer: { select: { email: true, name: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && order.vendorId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!["PAYMENT_HELD", "SHIPPED"].includes(order.status)) {
    return NextResponse.json(
      { error: "Cette commande ne peut pas être marquée comme expédiée" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = shipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  const { trackingNumber, trackingCarrier } = parsed.data;

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "SHIPPED",
      trackingNumber,
      trackingCarrier: trackingCarrier ?? null,
      shippedAt: new Date(),
    },
  });

  // Email acheteur
  if (order.buyer?.email) {
    const { subject, html } = orderShippedBuyer({
      buyerName: order.buyer.name || "Client",
      listingTitle: order.listing.titleAdmin || order.listing.title,
      trackingNumber,
      trackingCarrier,
      orderId: order.id,
    });
    sendEmail({ to: order.buyer.email, subject, html });
  }

  return NextResponse.json({
    ...updated,
    total: Number(updated.total),
    subtotal: Number(updated.subtotal),
    platformFee: Number(updated.platformFee),
    shippingCost: Number(updated.shippingCost),
    vendorAmount: Number(updated.vendorAmount),
  });
}
