import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Retourne le statut Stripe Connect du vendeur connecté
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeAccountId: true,
      stripeOnboarded: true,
      stripeDetailsSubmitted: true,
    },
  });

  return NextResponse.json({
    stripeAccountId: user?.stripeAccountId ?? null,
    stripeOnboarded: user?.stripeOnboarded ?? false,
    stripeDetailsSubmitted: user?.stripeDetailsSubmitted ?? false,
  });
}
