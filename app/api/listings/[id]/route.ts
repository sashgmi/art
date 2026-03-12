import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { ListingStatus, StockLocation } from "@prisma/client";

// ── GET /api/listings/[id] ────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: {
      OR: [{ id: id }, { slug: id }],
    },
    include: {
      images: { orderBy: { order: "asc" } },
      category: true,
      vendor: {
        select: {
          id: true,
          name: true,
          vendorProfile: {
            select: {
              businessName: true,
              description: true,
              city: true,
              country: true,
              rating: true,
              totalSales: true,
            },
          },
        },
      },
      tags: { include: { tag: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  // Increment view count (fire and forget)
  prisma.listing
    .update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(console.error);

  // Return admin override values when present
  return NextResponse.json({
    ...listing,
    displayTitle: listing.titleAdmin || listing.title,
    displayDescription: listing.descriptionAdmin || listing.description,
    displayPrice: listing.priceAdmin || listing.price,
  });
}

// ── PATCH /api/listings/[id] ──────────────────────────────────
const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  period: z.string().optional(),
  origin: z.string().optional(),
  dimensions: z.string().optional(),
  condition: z.string().optional(),
  materials: z.string().optional(),
  provenance: z.string().optional(),
  stockLocation: z.nativeEnum(StockLocation).optional(),
  categoryId: z.string().optional(),
  shippingCost: z.number().optional(),
  shippingDetails: z.string().optional(),
  // Admin-only fields
  titleAdmin: z.string().optional(),
  descriptionAdmin: z.string().optional(),
  priceAdmin: z.number().optional(),
  adminNotes: z.string().optional(),
  status: z.nativeEnum(ListingStatus).optional(),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: id } });
  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  const isOwner = listing.vendorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    // Restrict admin-only fields
    if (!isAdmin) {
      delete data.titleAdmin;
      delete data.descriptionAdmin;
      delete data.priceAdmin;
      delete data.adminNotes;
      delete data.status;
      delete data.rejectionReason;
    }

    // Set status-specific timestamps
    const statusUpdates: Record<string, Date | string> = {};
    if (data.status === ListingStatus.PENDING_REVIEW) {
      statusUpdates.submittedAt = new Date();
    }
    if (data.status === ListingStatus.LIVE) {
      statusUpdates.publishedAt = listing.publishedAt || new Date();
      statusUpdates.reviewedAt = new Date();
      statusUpdates.reviewedBy = session.user.id;
    }
    if (data.status === ListingStatus.REJECTED) {
      statusUpdates.reviewedAt = new Date();
      statusUpdates.reviewedBy = session.user.id;
    }

    const updated = await prisma.listing.update({
      where: { id: id },
      data: { ...data, ...statusUpdates },
      include: { images: true, category: true },
    });

    // Audit log
    if (isAdmin && data.status) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `LISTING_${data.status}`,
          entity: "Listing",
          entityId: id,
          metadata: { reason: data.rejectionReason },
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Update listing error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE /api/listings/[id] ─────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: id } });
  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  const isOwner = listing.vendorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Only allow deletion of DRAFT / REJECTED listings
  if (!["DRAFT", "REJECTED", "ARCHIVED"].includes(listing.status)) {
    return NextResponse.json(
      { error: "Impossible de supprimer une annonce active" },
      { status: 400 }
    );
  }

  await prisma.listing.update({
    where: { id: id },
    data: { status: ListingStatus.ARCHIVED },
  });

  return NextResponse.json({ success: true });
}
