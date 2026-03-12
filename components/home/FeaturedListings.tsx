import React from "react";
import Link from "next/link";
import Image from "next/image";
import ListingCard from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Listing {
  id: string;
  slug: string;
  title: string;
  titleAdmin?: string | null;
  price: any;
  priceAdmin?: any;
  period?: string | null;
  origin?: string | null;
  stockLocation: string;
  images: { url: string; altText?: string | null }[];
  category?: { name: string } | null;
}

interface Props {
  listings: Listing[];
}

export default function FeaturedListings({ listings }: Props) {
  if (listings.length === 0) return null;

  const heroImages = listings.slice(0, 4);
  const displayTitle = (l: Listing) => l.titleAdmin || l.title;

  return (
    <>
      {/* ── Intro split block ─────────────────────────────── */}
      <section className="border-b border-border bg-white py-14">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">

            {/* Left — text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-600 font-medium mb-4">
                Sélection d&apos;experts
              </p>
              <h2 className="font-serif text-4xl font-semibold leading-snug text-foreground mb-4 lg:text-5xl">
                Antiquités & Art
                <br />
                <span className="font-light italic text-muted-foreground">
                  d&apos;Exception
                </span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-8">
                Chaque pièce est certifiée par nos experts et vendue avec
                paiement sécurisé en séquestre.
              </p>
              <Link href="/catalogue">
                <Button variant="gold-outline" className="group">
                  Explorer le catalogue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* Right — 2×2 image grid */}
            <div className="flex-1 grid grid-cols-2 gap-2 max-w-lg mx-auto lg:mx-0 w-full">
              {heroImages.map((listing) => {
                const img = listing.images[0];
                return (
                  <Link
                    key={listing.id}
                    href={`/catalogue/${listing.slug}`}
                    className="group relative aspect-square overflow-hidden bg-muted rounded-sm"
                  >
                    {img ? (
                      <Image
                        src={img.url}
                        alt={img.altText || displayTitle(listing)}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-stone-100" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Listings grid ──────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="museum-grid">
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/catalogue">
              <Button variant="gold-outline" size="lg" className="group">
                Voir tout le catalogue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
