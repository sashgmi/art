import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ibanSchema = z.object({
  iban: z
    .string()
    .min(15, "IBAN trop court")
    .max(34, "IBAN trop long")
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, "Format IBAN invalide (ex: FR7630006000011234567890189)"),
  bicSwift: z.string().max(11).optional().or(z.literal("")),
  bankName: z.string().max(100).optional().or(z.literal("")),
});

// GET — retourne les coordonnées bancaires du vendeur connecté
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { iban: true, bicSwift: true, bankName: true },
  });

  return NextResponse.json({
    iban: profile?.iban ?? "",
    bicSwift: profile?.bicSwift ?? "",
    bankName: profile?.bankName ?? "",
  });
}

// PATCH — enregistre les coordonnées bancaires
export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!["VENDOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { iban, bicSwift, bankName } = ibanSchema.parse(body);

    const profile = await prisma.vendorProfile.update({
      where: { userId: session.user.id },
      data: {
        iban: iban.replace(/\s/g, "").toUpperCase(),
        bicSwift: bicSwift || null,
        bankName: bankName || null,
      },
      select: { iban: true, bicSwift: true, bankName: true },
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("IBAN update error:", error);
    return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
  }
}
