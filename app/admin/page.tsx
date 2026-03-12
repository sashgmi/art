import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Package, ShoppingBag, Users, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAdminStats() {
  const [
    pendingListings,
    activeListings,
    heldOrders,
    totalVendors,
    recentOrders,
  ] = await Promise.all([
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.listing.count({ where: { status: "LIVE" } }),
    prisma.order.findMany({
      where: { status: { in: ["PAYMENT_HELD", "CONFIRMED"] } },
      include: {
        listing: { select: { title: true, titleAdmin: true } },
        buyer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "VENDOR" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        listing: { select: { title: true, titleAdmin: true } },
        buyer: { select: { name: true } },
      },
    }),
  ]);

  const totalHeld = heldOrders.reduce(
    (sum, o) => sum + Number(o.vendorAmount),
    0
  );

  return {
    pendingListings,
    activeListings,
    heldOrders,
    totalHeld,
    totalVendors,
    recentOrders,
  };
}

export default async function AdminDashboard() {
  const {
    pendingListings,
    activeListings,
    heldOrders,
    totalHeld,
    totalVendors,
    recentOrders,
  } = await getAdminStats();

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d&apos;ensemble de la plateforme
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Annonces à valider",
            value: pendingListings,
            icon: Clock,
            urgent: pendingListings > 0,
            href: "/admin/annonces",
          },
          {
            label: "Annonces actives",
            value: activeListings,
            icon: Package,
            href: "/admin/annonces",
          },
          {
            label: "Fonds en séquestre",
            value: formatPrice(totalHeld),
            icon: TrendingUp,
            href: "/admin/commandes",
          },
          {
            label: "Vendeurs",
            value: totalVendors,
            icon: Users,
            href: "/admin/vendeurs",
          },
        ].map((stat, i) => (
          <Link key={i} href={stat.href}>
            <div
              className={`rounded-sm border bg-white p-5 hover:border-foreground/30 transition-colors cursor-pointer ${
                stat.urgent ? "border-amber-300 bg-amber-50" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon
                  className={`h-4 w-4 ${
                    stat.urgent ? "text-amber-600" : "text-muted-foreground"
                  }`}
                />
                {stat.urgent && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <div
                className={`font-serif text-2xl font-semibold ${
                  stat.urgent ? "text-amber-800" : ""
                }`}
              >
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Held orders requiring action */}
      {heldOrders.length > 0 && (
        <div className="rounded-sm border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-200 flex items-center justify-between">
            <h2 className="font-serif font-semibold text-amber-800">
              Fonds en séquestre — Action requise
            </h2>
            <Link href="/admin/commandes">
              <Button variant="outline" size="sm">
                Tout voir <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-amber-200">
            {heldOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm text-amber-900">
                    {order.listing.titleAdmin || order.listing.title}
                  </p>
                  <p className="text-xs text-amber-700">
                    Acheteur: {order.buyer?.name || "Inconnu"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-amber-800">
                    {formatPrice(Number(order.vendorAmount))}
                  </span>
                  <Badge
                    variant={
                      order.status === "CONFIRMED" ? "success" : "warning"
                    }
                  >
                    {order.status === "CONFIRMED"
                      ? "Confirmé — libérer ?"
                      : "En séquestre"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="rounded-sm border border-border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-serif font-semibold">Commandes récentes</h2>
          <Link href="/admin/commandes">
            <Button variant="ghost" size="sm">
              Toutes les commandes <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="divide-y">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="px-5 py-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-sm">
                  {order.listing.titleAdmin || order.listing.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">
                  {formatPrice(Number(order.total))}
                </span>
                <Badge variant="default" className="text-xs">
                  {order.status}
                </Badge>
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Aucune commande pour l&apos;instant
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
