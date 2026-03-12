import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BuyerOrdersClient from "./BuyerOrdersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes commandes" };

export default async function MesCommandesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte/commandes");

  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
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
    <div className="container mx-auto max-w-4xl px-4 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">Mes commandes</h1>
        <p className="text-muted-foreground mt-1">
          Suivez vos achats et confirmez la réception de vos articles.
        </p>
      </div>
      <BuyerOrdersClient orders={serialized as any} />
    </div>
  );
}
