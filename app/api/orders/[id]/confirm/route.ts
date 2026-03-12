import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { receptionConfirmedVendor } from "@/lib/emails/templates";

const confirmSchema = z.object({
  note: z.string().optional(),
});

// POST /api/orders/[id]/confirm — Buyer confirms reception and satisfaction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: id },
    include: {
      listing: { select: { title: true, titleAdmin: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!["SHIPPED", "DELIVERED", "PAYMENT_HELD"].includes(order.status)) {
    return NextResponse.json(
      { error: "Cette commande ne peut pas être confirmée" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { note } = confirmSchema.parse(body);

  const updated = await prisma.order.update({
    where: { id: id },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
      confirmedNote: note,
    },
  });

  // Email vendeur
  const vendor = await prisma.user.findUnique({
    where: { id: order.vendorId },
    select: { email: true, name: true },
  });
  if (vendor?.email) {
    const { subject, html } = receptionConfirmedVendor({
      vendorName: vendor.name || "Vendeur",
      listingTitle: order.listing.titleAdmin ?? order.listing.title,
      vendorAmount: Number(order.vendorAmount),
      orderId: order.id,
    });
    sendEmail({ to: vendor.email, subject, html });
  }

  return NextResponse.json(updated);
}
