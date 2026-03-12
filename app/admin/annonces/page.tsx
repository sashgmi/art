import { prisma } from "@/lib/prisma";
import AdminListingsClient from "./AdminListingsClient";

export const metadata = { title: "Modération des annonces" };

export default async function AdminAnnoncesPage() {
  const listings = await prisma.listing.findMany({
    where: {
      status: { in: ["PENDING_REVIEW", "LIVE", "REVISION", "REJECTED", "DRAFT"] },
    },
    orderBy: [
      // PENDING_REVIEW first
      { submittedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      images: { orderBy: { order: "asc" } },
      category: { select: { name: true } },
      vendor: {
        select: {
          id: true,
          name: true,
          vendorProfile: { select: { businessName: true } },
        },
      },
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">
          Modération des annonces
        </h1>
        <p className="text-muted-foreground mt-1">
          Examinez, modifiez et validez les annonces soumises par les vendeurs.
        </p>
      </div>
      <AdminListingsClient listings={listings as any} categories={categories} />
    </div>
  );
}
