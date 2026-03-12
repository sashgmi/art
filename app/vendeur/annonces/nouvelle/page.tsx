import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NewListingForm from "./NewListingForm";

export const metadata = { title: "Nouvelle annonce" };

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">
          Nouvelle annonce
        </h1>
        <p className="text-muted-foreground mt-1">
          Remplissez ce formulaire. Votre annonce sera soumise à la validation
          de l&apos;administrateur avant publication.
        </p>
      </div>
      <NewListingForm categories={categories} />
    </div>
  );
}
