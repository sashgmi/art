import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ProductDetail from "./ProductDetail";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getListing(slug: string) {
  return prisma.listing.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      status: { in: ["LIVE", "RESERVED", "SOLD"] },
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
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: "Article introuvable" };

  const title = listing.titleAdmin || listing.title;
  const description = (listing.descriptionAdmin || listing.description).slice(
    0,
    160
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.images[0]
        ? [{ url: listing.images[0].url }]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [listing, session] = await Promise.all([
    getListing(slug),
    auth(),
  ]);

  if (!listing) notFound();

  // Increment view count
  prisma.listing
    .update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  const listingData = {
    ...listing,
    displayTitle: listing.titleAdmin || listing.title,
    displayDescription: listing.descriptionAdmin || listing.description,
    displayPrice: listing.priceAdmin
      ? Number(listing.priceAdmin)
      : Number(listing.price),
    price: Number(listing.price),
    priceAdmin: listing.priceAdmin ? Number(listing.priceAdmin) : null,
    shippingCost: listing.shippingCost ? Number(listing.shippingCost) : null,
  };

  return (
    <div className="pt-16">
      <ProductDetail listing={listingData} session={session} />
    </div>
  );
}
