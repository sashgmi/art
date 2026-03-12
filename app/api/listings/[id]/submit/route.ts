import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ListingStatus } from "@prisma/client";

// POST /api/listings/[id]/submit — Vendor submits listing for admin review
export async function POST(
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

  if (listing.vendorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!["DRAFT", "REVISION"].includes(listing.status)) {
    return NextResponse.json(
      { error: "Cette annonce ne peut pas être soumise pour validation" },
      { status: 400 }
    );
  }

  const updated = await prisma.listing.update({
    where: { id: id },
    data: {
      status: ListingStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
