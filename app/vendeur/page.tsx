import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  PlusCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getVendorStats(userId: string) {
  const [listings, orders, profile] = await Promise.all([
    prisma.listing.findMany({
      where: { vendorId: userId },
      select: { id: true, status: true, title: true, titleAdmin: true },
    }),
    prisma.order.findMany({
      where: { vendorId: userId },
      select: {
        id: true,
        status: true,
        total: true,
        vendorAmount: true,
        createdAt: true,
        listing: { select: { title: true, titleAdmin: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.vendorProfile.findUnique({
      where: { userId },
      select: { iban: true },
    }),
  ]);

  const statusCounts = listings.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return { listings, orders, profile, statusCounts };
}

export default async function VendeurDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { listings, orders, profile, statusCounts } = await getVendorStats(
    session.user.id
  );

  const hasIban = !!profile?.iban;
  const pendingFunds = orders
    .filter((o) => o.status === "PAYMENT_HELD")
    .reduce((sum, o) => sum + Number(o.vendorAmount), 0);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">
          Bonjour, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos annonces et suivez vos ventes
        </p>
      </div>

      {/* Alerte IBAN manquant */}
      {!hasIban && (
        <div className="mb-6 flex items-start gap-4 rounded-sm bg-amber-50 border border-amber-200 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">
              Renseignez vos coordonnées bancaires
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Pour recevoir vos paiements, veuillez enregistrer votre IBAN dans
              la section Paiements.
            </p>
          </div>
          <Link href="/vendeur/paiements">
            <Button size="sm" variant="gold">
              Configurer →
            </Button>
          </Link>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {[
          {
            label: "Annonces actives",
            value: statusCounts.LIVE || 0,
            icon: CheckCircle,
            color: "text-emerald-600",
          },
          {
            label: "En attente de validation",
            value: statusCounts.PENDING_REVIEW || 0,
            icon: Clock,
            color: "text-amber-600",
          },
          {
            label: "Brouillons",
            value: statusCounts.DRAFT || 0,
            icon: Package,
            color: "text-muted-foreground",
          },
          {
            label: "Fonds en séquestre",
            value: formatPrice(pendingFunds),
            icon: CreditCard,
            color: "text-gold-600",
          },
        ].map((stat, i) => (
          <div key={i} className="rounded-sm border border-border bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="font-serif text-2xl font-semibold">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link href="/vendeur/annonces/nouvelle">
          <Button variant="default" size="sm">
            <PlusCircle className="h-4 w-4" />
            Nouvelle annonce
          </Button>
        </Link>
        <Link href="/vendeur/annonces">
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4" />
            Voir mes annonces
          </Button>
        </Link>
      </div>

      {/* Recent orders */}
      {orders.length > 0 && (
        <div className="rounded-sm border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-serif font-semibold">Dernières commandes</h2>
          </div>
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <div key={order.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {order.listing.titleAdmin || order.listing.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatPrice(Number(order.vendorAmount))}
                    </p>
                    <p className="text-xs text-muted-foreground">votre part</p>
                  </div>
                  <Badge
                    variant={
                      order.status === "FUNDS_RELEASED"
                        ? "success"
                        : order.status === "PAYMENT_HELD"
                        ? "warning"
                        : "default"
                    }
                    className="text-xs"
                  >
                    {order.status === "PAYMENT_HELD"
                      ? "En séquestre"
                      : order.status === "FUNDS_RELEASED"
                      ? "Versé"
                      : order.status === "CONFIRMED"
                      ? "Confirmé"
                      : order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
