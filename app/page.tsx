import FeaturedListings from "@/components/home/FeaturedListings";
import CategoryBar from "@/components/home/CategoryBar";
import HowItWorks from "@/components/home/HowItWorks";
import TrustSection from "@/components/home/TrustSection";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getFeaturedListings() {
  const listings = await prisma.listing.findMany({
    where: { status: "LIVE" },
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: 8,
    select: {
      id: true,
      slug: true,
      title: true,
      titleAdmin: true,
      price: true,
      priceAdmin: true,
      period: true,
      origin: true,
      stockLocation: true,
      images: {
        where: { isPrimary: true },
        select: { url: true, altText: true },
        take: 1,
      },
      category: { select: { name: true } },
    },
  });

  // Convertir les Decimal Prisma en Number pour la sérialisation vers les Client Components
  return listings.map((l) => ({
    ...l,
    price: Number(l.price),
    priceAdmin: l.priceAdmin ? Number(l.priceAdmin) : null,
  }));
}

async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
  });
}

export default async function HomePage() {
  const [listings, categories] = await Promise.all([
    getFeaturedListings(),
    getCategories(),
  ]);

  return (
    <div className="pt-16">
      <CategoryBar categories={categories} />
      <FeaturedListings listings={listings} />
      <HowItWorks />
      <TrustSection />
    </div>
  );
}
