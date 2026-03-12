"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { MapPin, Home } from "lucide-react";

interface ListingCardProps {
  listing: {
    id: string;
    slug: string;
    title: string;
    titleAdmin?: string | null;
    price: number | string;
    priceAdmin?: number | string | null;
    period?: string | null;
    origin?: string | null;
    stockLocation: string;
    images: { url: string; altText?: string | null }[];
    category?: { name: string } | null;
  };
  index?: number;
  variant?: "museum" | "masonry";
}

export default function ListingCard({
  listing,
  index = 0,
  variant = "museum",
}: ListingCardProps) {
  const title = listing.titleAdmin || listing.title;
  const price = listing.priceAdmin || listing.price;
  const image = listing.images[0];
  const isAtResidence = listing.stockLocation === "AT_RESIDENCE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/catalogue/${listing.slug}`} className="group block">
        <div
          className={`overflow-hidden bg-white border border-border hover:border-foreground/20 transition-all duration-300 hover:shadow-lg ${
            variant === "museum" ? "rounded-sm" : "rounded-sm"
          }`}
        >
          {/* Image */}
          <div
            className={`relative overflow-hidden bg-muted ${
              variant === "museum" ? "aspect-[4/3]" : ""
            }`}
            style={
              variant === "masonry"
                ? { paddingBottom: `${60 + (index % 3) * 15}%` }
                : undefined
            }
          >
            {image ? (
              <Image
                src={image.url}
                alt={image.altText || title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                <svg
                  className="h-16 w-16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}

            {/* Location badge */}
            <div className="absolute top-3 left-3">
              <Badge
                variant={isAtResidence ? "residence" : "vendor"}
                className="text-xs shadow-sm"
              >
                {isAtResidence ? (
                  <>
                    <Home className="h-2.5 w-2.5" />
                    À la Résidence
                  </>
                ) : (
                  <>
                    <MapPin className="h-2.5 w-2.5" />
                    Chez le Vendeur
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Category + Period */}
            <div className="flex items-center gap-2 mb-2">
              {listing.category && (
                <span className="text-xs text-muted-foreground tracking-wide">
                  {listing.category.name}
                </span>
              )}
              {listing.category && listing.period && (
                <span className="text-muted-foreground/30 text-xs">·</span>
              )}
              {listing.period && (
                <span className="text-xs text-muted-foreground">
                  {listing.period}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-serif text-base font-semibold leading-snug mb-1 group-hover:text-gold-600 transition-colors line-clamp-2">
              {title}
            </h3>

            {/* Origin */}
            {listing.origin && (
              <p className="text-xs text-muted-foreground mb-3">
                {listing.origin}
              </p>
            )}

            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg font-semibold text-foreground">
                {formatPrice(Number(price))}
              </span>
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                Voir le détail →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
