import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import EditListingForm from "./EditListingForm";

export const dynamic = "force-dynamic";

const EDITABLE = ["DRAFT", "REVISION", "PENDING_REVIEW", "LIVE"];

export default async function ModifierAnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const [listing, categories] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!listing || listing.vendorId !== session.user.id) notFound();
  if (!EDITABLE.includes(listing.status)) redirect("/vendeur/annonces");

  const serialized = {
    id: listing.id,
    title: listing.title,
    description: listing.description ?? "",
    provenance: listing.provenance ?? "",
    price: Number(listing.price),
    period: listing.period ?? "",
    origin: listing.origin ?? "",
    dimensions: listing.dimensions ?? "",
    weight: listing.weight ?? "",
    condition: listing.condition ?? "",
    materials: listing.materials ?? "",
    categoryId: listing.categoryId ?? "",
    stockLocation: listing.stockLocation as "AT_VENDOR" | "AT_RESIDENCE",
    shippingAvailable: listing.shippingAvailable,
    shippingCost: listing.shippingCost ? Number(listing.shippingCost) : 0,
    shippingDetails: listing.shippingDetails ?? "",
    pickupAvailable: listing.pickupAvailable,
    status: listing.status,
    images: listing.images.map((img) => ({
      id: img.id,
      url: img.url,
      thumbnailUrl: img.thumbnailUrl ?? null,
      publicId: img.publicId,
      isPrimary: img.isPrimary,
      order: img.order,
    })),
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">Modifier l&apos;annonce</h1>
        <p className="text-muted-foreground mt-1 truncate">{listing.title}</p>
        {listing.status === "LIVE" && (
          <div className="mt-3 rounded-sm bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
            Cette annonce est en ligne. Toute modification la soumettra de nouveau à validation admin.
          </div>
        )}
      </div>
      <EditListingForm listing={serialized} categories={categories} />
    </div>
  );
}
