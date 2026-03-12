import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// GET — Retourne le lien vers le tableau de bord Stripe Express du vendeur
export async function GET() {
  const session = await auth();

  if (!session?.user || !["VENDOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeAccountId: true, stripeOnboarded: true },
  });

  if (!user?.stripeAccountId || !user?.stripeOnboarded) {
    return NextResponse.json(
      { error: "Compte Stripe Express non configuré" },
      { status: 400 }
    );
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(
      user.stripeAccountId
    );
    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error("Stripe dashboard error:", error);
    return NextResponse.json(
      { error: "Impossible d'accéder au tableau de bord Stripe" },
      { status: 500 }
    );
  }
}
