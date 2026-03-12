import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CatalogueClient from "./CatalogueClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catalogue",
  description: "Parcourez notre catalogue d'antiquités et d'œuvres d'art.",
};

async function getInitialData(searchParams: Record<string, string>) {
  const [categories, listings] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.listing.findMany({
      where: {
        status: "LIVE",
        ...(searchParams.categoryId
          ? { categoryId: searchParams.categoryId }
          : {}),
        ...(searchParams.stockLocation
          ? { stockLocation: searchParams.stockLocation as any }
          : {}),
        ...(searchParams.search
          ? {
              OR: [
                {
                  title: {
                    contains: searchParams.search,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: searchParams.search,
                    mode: "insensitive",
                  },
                },
                {
                  period: {
                    contains: searchParams.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 24,
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
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  return { categories, listings };
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const resolvedParams = await searchParams;
  const { categories, listings } = await getInitialData(resolvedParams);

  return (
    <div className="pt-16 min-h-screen">
      <Suspense>
        <CatalogueClient
          initialListings={listings}
          categories={categories}
          initialFilters={resolvedParams}
        />
      </Suspense>
    </div>
  );
}
