import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  businessName: z.string().min(1, "Nom de l'activité requis").max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).default("France"),
  siret: z.string().max(20).optional().or(z.literal("")),
});

// GET — retourne le profil vendeur
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const profile = await prisma.vendorProfile.findUnique({
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
  });

  return NextResponse.json(profile ?? {});
}

// PATCH — met à jour le profil vendeur
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["VENDOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = profileSchema.parse(body);

    const profile = await prisma.vendorProfile.update({
      where: { userId: session.user.id },
      data: {
        businessName: data.businessName,
        description: data.description || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country,
        siret: data.siret || null,
      },
      select: {
        businessName: true,
        description: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        siret: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Compte update error:", error);
    return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
  }
}
