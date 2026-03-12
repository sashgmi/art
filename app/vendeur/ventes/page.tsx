import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import VendeurVentesClient from "./VendeurVentesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes ventes" };

export default async function MesVentesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/vendeur/ventes");
  if (!["VENDOR", "ADMIN"].includes(session.user.role)) redirect("/");

  const orders = await prisma.order.findMany({
    where: { vendorId: session.user.id },
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

  const serialized = orders.map((o) => ({
    ...o,
    total: Number(o.total),
    subtotal: Number(o.subtotal),
    platformFee: Number(o.platformFee),
    shippingCost: Number(o.shippingCost),
    vendorAmount: Number(o.vendorAmount),
    createdAt: o.createdAt.toISOString(),
    confirmedAt: o.confirmedAt?.toISOString() ?? null,
    shippedAt: o.shippedAt?.toISOString() ?? null,
    fundsReleasedAt: o.fundsReleasedAt?.toISOString() ?? null,
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Mes ventes</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos commandes et renseignez les numéros de suivi.
        </p>
      </div>
      <VendeurVentesClient orders={serialized as any} />
    </div>
  );
}
