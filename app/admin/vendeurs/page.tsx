import { prisma } from "@/lib/prisma";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vendeurs — Administration",
};

async function getVendors() {
  return prisma.user.findMany({
    where: { role: "VENDOR" },
    orderBy: { createdAt: "desc" },
    include: {
      vendorProfile: true,
      listings: {
        select: { id: true, status: true },
      },
      _count: {
        select: { listings: true },
      },
    },
  });
}

export default async function AdminVendeursPage() {
  const vendors = await getVendors();

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Vendeurs</h1>
        <p className="text-muted-foreground mt-1">
          {vendors.length} vendeur{vendors.length !== 1 ? "s" : ""} inscrit{vendors.length !== 1 ? "s" : ""}
        </p>
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-sm border border-border bg-white px-5 py-16 text-center text-sm text-muted-foreground">
          Aucun vendeur inscrit pour le moment.
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Vendeur</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Inscrit le</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">Annonces</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">En ligne</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">IBAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vendors.map((vendor) => {
                const liveCount = vendor.listings.filter((l) => l.status === "LIVE").length;
                const pendingCount = vendor.listings.filter((l) => l.status === "PENDING_REVIEW").length;
                const hasIban = !!vendor.vendorProfile?.iban;

                return (
                  <tr key={vendor.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{vendor.name}</div>
                      <div className="text-xs text-muted-foreground">{vendor.email}</div>
                      {vendor.vendorProfile?.businessName && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {vendor.vendorProfile.businessName}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(vendor.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="font-medium">{vendor._count.listings}</div>
                      {pendingCount > 0 && (
                        <div className="text-xs text-amber-600">{pendingCount} en attente</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-medium">{liveCount}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {hasIban ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          IBAN enregistré
                        </Badge>
                      ) : (
                        <Badge variant="secondary">IBAN manquant</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
