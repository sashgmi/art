import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ComptePage() {
  const session = await auth();
  if (!session) redirect("/connexion");
  if (session.user.role === "VENDOR") redirect("/vendeur/compte");
  if (session.user.role === "ADMIN") redirect("/admin");
  redirect("/compte/commandes");
}
