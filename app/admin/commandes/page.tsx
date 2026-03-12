import { prisma } from "@/lib/prisma";
import AdminOrdersClient from "./AdminOrdersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes & Séquestre" };

export default async function AdminCommandesPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          titleAdmin: true,
          slug: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
      },
      buyer: { select: { id: true, name: true, email: true } },
    },
  });

  // Récupérer les profils vendeurs (IBAN + Stripe Connect)
  const vendorIds = [...new Set(orders.map((o) => o.vendorId))];
  const [vendorProfiles, vendorUsers] = await Promise.all([
    prisma.vendorProfile.findMany({
      where: { userId: { in: vendorIds } },
      select: { userId: true, iban: true, bicSwift: true, bankName: true },
    }),
    prisma.user.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, stripeAccountId: true, stripeOnboarded: true },
    }),
  ]);
  const profileByVendorId = Object.fromEntries(
    vendorProfiles.map((p) => [p.userId, p])
  );
  const userByVendorId = Object.fromEntries(
    vendorUsers.map((u) => [u.id, u])
  );

  const now = Date.now();
  const AUTO_CONFIRM_DAYS = 10;

  const ordersWithIban = orders.map((o) => {
    const daysShipped = o.shippedAt
      ? Math.floor((now - o.shippedAt.getTime()) / 86400000)
      : null;
    const isAutoEligible =
      o.status === "SHIPPED" &&
      daysShipped !== null &&
      daysShipped >= AUTO_CONFIRM_DAYS;

    return {
      ...o,
      shippedAt: o.shippedAt?.toISOString() ?? null,
      daysShipped,
      isAutoEligible,
      vendorIban: profileByVendorId[o.vendorId]?.iban ?? null,
      vendorBic: profileByVendorId[o.vendorId]?.bicSwift ?? null,
      vendorBankName: profileByVendorId[o.vendorId]?.bankName ?? null,
      vendorStripeConnected: !!(
        userByVendorId[o.vendorId]?.stripeAccountId &&
        userByVendorId[o.vendorId]?.stripeOnboarded
      ),
    };
  });

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">
          Commandes & Séquestre
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les commandes et libérez les fonds après confirmation des acheteurs.
        </p>
      </div>
      <AdminOrdersClient orders={ordersWithIban as any} />
    </div>
  );
}
