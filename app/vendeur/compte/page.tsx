import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CompteForm from "./CompteForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon compte" };

export default async function VendeurComptePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
    prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        businessName: true,
        description: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        siret: true,
        isVerified: true,
        verifiedAt: true,
        totalSales: true,
        totalRevenue: true,
        rating: true,
      },
    }),
  ]);

  if (!profile) redirect("/vendeur");

  return (
    <CompteForm
      profile={{
        ...profile,
        totalRevenue: Number(profile.totalRevenue),
      }}
      userName={user?.name ?? null}
      userEmail={user?.email ?? null}
    />
  );
}
