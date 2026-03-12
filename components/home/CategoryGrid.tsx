import React from "react";
import Link from "next/link";

interface Props {
  categories: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    _count: { listings: number };
  }[];
}

// Curated imagery per category for the demo
const categoryImages: Record<string, string> = {
  mobilier:
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
  "tableaux-peintures":
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80",
  "sculptures-bronzes":
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  "arts-decoratifs":
    "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&q=80",
  "ceramique-porcelaine":
    "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80",
  "argenterie-orfevrerie":
    "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80",
};

export default function CategoryGrid({ categories }: Props) {
  return (
    <section className="py-20 bg-stone-50">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="gold-divider" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium">
              Collections
            </span>
            <div className="gold-divider" />
          </div>
          <h2 className="font-serif text-4xl font-semibold tracking-tight">
            Explorer par Catégorie
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {categories.slice(0, 6).map((cat, i) => {
            const image =
              categoryImages[cat.slug] ||
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80";

            return (
              <Link
                key={cat.id}
                href={`/catalogue?categoryId=${cat.id}`}
                className="group relative overflow-hidden rounded-sm bg-muted aspect-square flex items-end"
              >
                {/* Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Content */}
                <div className="relative p-4 w-full">
                  <h3 className="font-serif text-white font-semibold text-base leading-tight">
                    {cat.name}
                  </h3>
                  {cat._count.listings > 0 && (
                    <p className="text-white/60 text-xs mt-0.5">
                      {cat._count.listings} article
                      {cat._count.listings > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
