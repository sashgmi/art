"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  MapPin,
  Home,
  Shield,
  Truck,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Package,
  Star,
  AlertCircle,
  Info,
} from "lucide-react";
import CheckoutModal from "@/components/checkout/CheckoutModal";

interface ListingImage {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  order: number;
}

interface Listing {
  id: string;
  slug: string;
  displayTitle: string;
  displayDescription: string;
  displayPrice: number;
  title: string;
  description: string;
  price: number;
  priceAdmin: number | null;
  shippingCost: number | null;
  period?: string | null;
  origin?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  condition?: string | null;
  materials?: string | null;
  provenance?: string | null;
  shippingAvailable: boolean;
  shippingDetails?: string | null;
  pickupAvailable: boolean;
  stockLocation: string;
  status: string;
  category?: { name: string; slug: string } | null;
  images: ListingImage[];
  vendor: {
    id: string;
    name: string | null;
    vendorProfile?: {
      businessName: string;
      description?: string | null;
      city?: string | null;
      country: string;
      rating?: number | null;
      totalSales: number;
    } | null;
  };
}

interface Props {
  listing: Listing;
  session: any;
}

export default function ProductDetail({ listing, session }: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const isAtResidence = listing.stockLocation === "AT_RESIDENCE";
  const isAvailable = listing.status === "LIVE";
  const vendorName =
    listing.vendor.vendorProfile?.businessName || listing.vendor.name || "Vendeur";

  const prevImage = () =>
    setCurrentImageIndex((i) =>
      i === 0 ? listing.images.length - 1 : i - 1
    );
  const nextImage = () =>
    setCurrentImageIndex((i) =>
      i === listing.images.length - 1 ? 0 : i + 1
    );

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="container mx-auto max-w-7xl px-4 py-4 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <span>/</span>
          <Link href="/catalogue" className="hover:text-foreground">
            Catalogue
          </Link>
          {listing.category && (
            <>
              <span>/</span>
              <Link
                href={`/catalogue?categoryId=${listing.category.slug}`}
                className="hover:text-foreground"
              >
                {listing.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground line-clamp-1 max-w-[200px]">
            {listing.displayTitle}
          </span>
        </nav>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Image Gallery ──────────────────────────── */}
          <div className="space-y-4">
            {/* Main image */}
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-sm bg-stone-100 cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            >
              {listing.images[currentImageIndex] ? (
                <Image
                  src={listing.images[currentImageIndex].url}
                  alt={
                    listing.images[currentImageIndex].altText ||
                    listing.displayTitle
                  }
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                  Pas d&apos;image
                </div>
              )}

              {/* Navigation arrows */}
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              <div className="absolute top-3 right-3">
                <ZoomIn className="h-5 w-5 text-white drop-shadow-sm opacity-60" />
              </div>

              <div className="absolute top-3 left-3">
                <Badge variant={isAtResidence ? "residence" : "vendor"}>
                  {isAtResidence ? (
                    <>
                      <Home className="h-3 w-3" />
                      À la Résidence
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3" />
                      Chez le Vendeur
                    </>
                  )}
                </Badge>
              </div>

              {/* Counter */}
              {listing.images.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
                  {currentImageIndex + 1} / {listing.images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {listing.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`relative flex-shrink-0 h-16 w-20 overflow-hidden rounded-sm border-2 transition-colors ${
                      i === currentImageIndex
                        ? "border-foreground"
                        : "border-transparent hover:border-muted-foreground/40"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || `Photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ──────────────────────────── */}
          <div className="space-y-6">
            {/* Category + Period */}
            <div className="flex flex-wrap items-center gap-2">
              {listing.category && (
                <Badge variant="outline">{listing.category.name}</Badge>
              )}
              {listing.period && (
                <Badge variant="gold">{listing.period}</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
              {listing.displayTitle}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-4xl font-bold text-foreground">
                {formatPrice(listing.displayPrice)}
              </span>
              {listing.shippingCost && listing.shippingCost > 0 ? (
                <span className="text-sm text-muted-foreground">
                  + {formatPrice(listing.shippingCost)} de livraison
                </span>
              ) : listing.shippingAvailable ? (
                <span className="text-sm text-emerald-600">
                  Livraison incluse
                </span>
              ) : null}
            </div>

            {/* Stock location context */}
            <div
              className={`flex items-start gap-3 rounded-sm p-4 text-sm ${
                isAtResidence
                  ? "bg-blue-50 border border-blue-100"
                  : "bg-violet-50 border border-violet-100"
              }`}
            >
              {isAtResidence ? (
                <Home className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    isAtResidence ? "text-blue-800" : "text-violet-800"
                  }`}
                >
                  {isAtResidence
                    ? "Article à la Résidence"
                    : "Article chez le Vendeur"}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isAtResidence ? "text-blue-600" : "text-violet-600"
                  }`}
                >
                  {isAtResidence
                    ? "Cet article est conservé dans notre résidence principale. Inspection sur rendez-vous possible."
                    : `Cet article est conservé par ${vendorName}.${
                        listing.vendor.vendorProfile?.city
                          ? ` Situé à ${listing.vendor.vendorProfile.city}.`
                          : ""
                      }`}
                </p>
              </div>
            </div>

            {/* CTA */}
            {isAvailable ? (
              <div className="space-y-3">
                {session ? (
                  <Button
                    size="xl"
                    variant="gold"
                    className="w-full"
                    onClick={() => setCheckoutOpen(true)}
                  >
                    Acheter maintenant
                  </Button>
                ) : (
                  <Link href={`/connexion?callbackUrl=/catalogue/${listing.slug}`}>
                    <Button size="xl" className="w-full">
                      Se connecter pour acheter
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  Paiement sécurisé · Fonds en séquestre jusqu&apos;à confirmation
                </div>
              </div>
            ) : (
              <div className="rounded-sm bg-muted p-4 text-center">
                <p className="font-medium text-muted-foreground">
                  {listing.status === "RESERVED"
                    ? "Article réservé — transaction en cours"
                    : "Article vendu"}
                </p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              {listing.origin && (
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">
                    Origine
                  </dt>
                  <dd className="text-sm font-medium">{listing.origin}</dd>
                </div>
              )}
              {listing.period && (
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">
                    Époque
                  </dt>
                  <dd className="text-sm font-medium">{listing.period}</dd>
                </div>
              )}
              {listing.dimensions && (
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">
                    Dimensions
                  </dt>
                  <dd className="text-sm font-medium">{listing.dimensions}</dd>
                </div>
              )}
              {listing.materials && (
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">
                    Matériaux
                  </dt>
                  <dd className="text-sm font-medium">{listing.materials}</dd>
                </div>
              )}
              {listing.weight && (
                <div>
                  <dt className="text-xs text-muted-foreground mb-0.5">
                    Poids
                  </dt>
                  <dd className="text-sm font-medium">{listing.weight}</dd>
                </div>
              )}
              {listing.condition && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground mb-0.5">
                    État de conservation
                  </dt>
                  <dd className="text-sm font-medium">{listing.condition}</dd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Description & Provenance ─────────────────── */}
        <div className="mt-16 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-4">
                Description
              </h2>
              <div className="prose-listing whitespace-pre-wrap">
                {listing.displayDescription}
              </div>
            </section>

            {/* Provenance */}
            {listing.provenance && (
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-4">
                  Provenance
                </h2>
                <div className="flex items-start gap-3 p-4 bg-champagne-50 rounded-sm border border-champagne-200">
                  <Info className="h-4 w-4 text-champagne-600 mt-0.5 shrink-0" />
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {listing.provenance}
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* ── Sidebar ────────────────────────────────── */}
          <div className="space-y-6">
            {/* Shipping */}
            <div className="rounded-sm border border-border p-5">
              <h3 className="font-serif font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Expédition
              </h3>
              {listing.shippingAvailable ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais</span>
                    <span className="font-medium">
                      {listing.shippingCost && listing.shippingCost > 0
                        ? formatPrice(listing.shippingCost)
                        : "Inclus"}
                    </span>
                  </div>
                  {listing.shippingDetails && (
                    <p className="text-muted-foreground text-xs pt-2 border-t">
                      {listing.shippingDetails}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cet article ne peut pas être expédié.
                </p>
              )}
              {listing.pickupAvailable && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <Package className="h-3.5 w-3.5" />
                    Remise en main propre disponible
                  </div>
                </div>
              )}
            </div>

            {/* Escrow guarantee */}
            <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="font-serif font-semibold mb-3 flex items-center gap-2 text-emerald-800">
                <Shield className="h-4 w-4" />
                Garantie Séquestre
              </h3>
              <ul className="space-y-2 text-xs text-emerald-700">
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  Votre paiement est sécurisé dès l&apos;achat
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  Les fonds sont retenus jusqu&apos;à votre confirmation
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  Inspection à réception avant libération
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  Remboursement intégral en cas de litige
                </li>
              </ul>
            </div>

            {/* Vendor */}
            <div className="rounded-sm border border-border p-5">
              <h3 className="font-serif font-semibold mb-3">Vendeur</h3>
              <div className="space-y-2">
                <p className="font-medium text-sm">{vendorName}</p>
                {listing.vendor.vendorProfile?.city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {listing.vendor.vendorProfile.city},{" "}
                    {listing.vendor.vendorProfile.country}
                  </p>
                )}
                {(listing.vendor.vendorProfile?.totalSales ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {listing.vendor.vendorProfile?.totalSales} vente
                    {(listing.vendor.vendorProfile?.totalSales ?? 0) > 1 ? "s" : ""}
                  </p>
                )}
                {listing.vendor.vendorProfile?.rating && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                    {listing.vendor.vendorProfile.rating.toFixed(1)} / 5
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && listing.images[currentImageIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setLightboxOpen(false)}
          >
            <div className="relative max-w-5xl max-h-screen w-full h-full flex items-center justify-center p-8">
              <Image
                src={listing.images[currentImageIndex].url}
                alt={listing.displayTitle}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout modal */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        listing={{
          id: listing.id,
          title: listing.displayTitle,
          price: listing.displayPrice,
          shippingCost: listing.shippingCost,
          images: listing.images,
        }}
      />
    </div>
  );
}
