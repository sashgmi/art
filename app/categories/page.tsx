import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catégories",
  description: "Explorez nos catégories d'antiquités et d'œuvres d'art.",
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { listings: { where: { status: "LIVE" } } } },
    },
  });

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto max-w-6xl px-4 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Collections
          </p>
          <h1 className="font-serif text-4xl font-medium text-foreground mb-4">
            Catégories
          </h1>
          <div className="gold-divider mx-auto" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalogue?categoryId=${cat.id}`}
              className="group block border border-border rounded-sm p-8 hover:border-gold-400 transition-colors"
            >
              <h2 className="font-serif text-xl font-medium text-foreground group-hover:text-gold-600 transition-colors mb-2">
                {cat.name}
              </h2>
              {cat.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {cat.description}
                </p>
              )}
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {cat._count.listings} annonce{cat._count.listings !== 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            Aucune catégorie disponible pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
