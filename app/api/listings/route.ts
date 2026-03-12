import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { ListingStatus, StockLocation } from "@prisma/client";

// ── GET /api/listings ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status") as ListingStatus | null;
  const categoryId = searchParams.get("categoryId");
  const period = searchParams.get("period");
  const stockLocation = searchParams.get("stockLocation") as StockLocation | null;
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "24");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    status: status || ListingStatus.LIVE,
    ...(categoryId ? { categoryId } : {}),
    ...(period ? { period: { contains: period, mode: "insensitive" } } : {}),
    ...(stockLocation ? { stockLocation } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { period: { contains: search, mode: "insensitive" } },
            { origin: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        titleAdmin: true,
        description: true,
        price: true,
        priceAdmin: true,
        currency: true,
        period: true,
        origin: true,
        stockLocation: true,
        status: true,
        viewCount: true,
        publishedAt: true,
        category: { select: { id: true, name: true, slug: true } },
        images: {
          where: { isPrimary: true },
          select: { url: true, altText: true },
          take: 1,
        },
        vendor: {
          select: {
            id: true,
            name: true,
            vendorProfile: { select: { businessName: true } },
          },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}

// ── POST /api/listings ────────────────────────────────────────
const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  price: z.number().positive(),
  period: z.string().optional(),
  origin: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  condition: z.string().optional(),
  materials: z.string().optional(),
  provenance: z.string().optional(),
  categoryId: z.string().optional(),
  stockLocation: z.nativeEnum(StockLocation).default(StockLocation.AT_VENDOR),
  shippingAvailable: z.boolean().default(true),
  shippingCost: z.number().optional(),
  shippingDetails: z.string().optional(),
  pickupAvailable: z.boolean().default(false),
  images: z.array(
    z.object({
      url: z.string().url(),
      publicId: z.string(),
      isPrimary: z.boolean().optional(),
      order: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createListingSchema.parse(body);

    const baseSlug = slugify(data.title);
    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.listing.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const listing = await prisma.listing.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        price: data.price,
        period: data.period,
        origin: data.origin,
        dimensions: data.dimensions,
        weight: data.weight,
        condition: data.condition,
        materials: data.materials,
        provenance: data.provenance,
        categoryId: data.categoryId,
        stockLocation: data.stockLocation,
        shippingAvailable: data.shippingAvailable,
        shippingCost: data.shippingCost,
        shippingDetails: data.shippingDetails,
        pickupAvailable: data.pickupAvailable,
        vendorId: session.user.id,
        status: ListingStatus.DRAFT,
        images: {
          create: data.images.map((img, i) => ({
            url: img.url,
            publicId: img.publicId,
            isPrimary: img.isPrimary ?? i === 0,
            order: img.order ?? i,
            width: img.width,
            height: img.height,
            uploadedBy: session.user.id,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create listing error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
