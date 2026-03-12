import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StripeRetourPage() {
  const session = await auth();

  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true },
    });

    if (user?.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            stripeOnboarded: account.charges_enabled ?? false,
            stripeDetailsSubmitted: account.details_submitted ?? false,
          },
        });
      } catch {
        // En cas d'erreur Stripe, on redirige quand même
      }
    }
  }

  redirect("/vendeur/paiements?stripe=connected");
}
