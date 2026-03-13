import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { PlusCircle, Package } from "lucide-react";
import ListingActions from "@/components/vendeur/ListingActions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_REVIEW: "En attente",
  REVISION: "À réviser",
  LIVE: "En ligne",
  RESERVED: "Réservé",
  SOLD: "Vendu",
  REJECTED: "Refusé",
  ARCHIVED: "Archivé",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "destructive"> = {
  DRAFT: "default",
  PENDING_REVIEW: "warning",
  REVISION: "warning",
  LIVE: "success",
  RESERVED: "warning",
  SOLD: "success",
  REJECTED: "destructive",
  ARCHIVED: "default",
};

export default async function VendeurAnnoncesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const listings = await prisma.listing.findMany({
    where: { vendorId: session.user.id },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Mes annonces</h1>
          <p className="text-muted-foreground mt-1">
            {listings.length} annonce{listings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/vendeur/annonces/nouvelle">
          <Button variant="gold" size="sm">
            <PlusCircle className="h-4 w-4" />
            Nouvelle annonce
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-sm border border-border bg-white p-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium">Aucune annonce pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Créez votre première annonce pour commencer à vendre.
          </p>
          <Link href="/vendeur/annonces/nouvelle">
            <Button variant="gold" size="sm">
              <PlusCircle className="h-4 w-4" />
              Créer une annonce
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-white overflow-hidden">
          <div className="divide-y divide-border">
            {listings.map((listing) => {
              const image = listing.images[0];
              const displayTitle = listing.titleAdmin || listing.title;
              const displayPrice = listing.priceAdmin ?? listing.price;
              return (
                <div key={listing.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-14 w-14 rounded-sm bg-stone-100 overflow-hidden shrink-0">
                    {image ? (
                      <img
                        src={image.thumbnailUrl || image.url}
                        alt={displayTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{displayTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {listing.category?.name ?? "Sans catégorie"} ·{" "}
                      {new Date(listing.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-medium text-sm">
                      {formatPrice(Number(displayPrice))}
                    </span>
                    <Badge variant={STATUS_VARIANTS[listing.status] ?? "default"} className="text-xs">
                      {STATUS_LABELS[listing.status] ?? listing.status}
                    </Badge>
                    <ListingActions listingId={listing.id} status={listing.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
