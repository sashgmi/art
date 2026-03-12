import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST — Crée un compte Stripe Express ou retourne un lien d'onboarding
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || !["VENDOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true, email: true },
    });

    let accountId = user?.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: user?.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeAccountId: accountId },
      });
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/vendeur/paiements`,
      return_url: `${origin}/vendeur/stripe/retour`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion à Stripe" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
