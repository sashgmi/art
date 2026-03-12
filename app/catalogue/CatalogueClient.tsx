"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Masonry from "react-masonry-css";
import { motion, AnimatePresence } from "framer-motion";
import ListingCard from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Layers, Search, SlidersHorizontal, X } from "lucide-react";

type ViewMode = "museum" | "masonry";

interface Category {
  id: string;
  name: string;
  slug: string;
}

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
  category?: { id: string; name: string; slug: string } | null;
}

interface Props {
  initialListings: Listing[];
  categories: Category[];
  initialFilters: Record<string, string>;
}

const PERIOD_OPTIONS = [
  { value: "XVIe siècle", label: "XVIe siècle" },
  { value: "XVIIe siècle", label: "XVIIe siècle" },
  { value: "XVIIIe siècle", label: "XVIIIe siècle" },
  { value: "XIXe siècle", label: "XIXe siècle" },
  { value: "Art Déco", label: "Art Déco (1920-1940)" },
  { value: "Art Nouveau", label: "Art Nouveau" },
  { value: "Moderne", label: "XXe siècle" },
];

const masonryBreakpoints = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1,
};

export default function CatalogueClient({
  initialListings,
  categories,
  initialFilters,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<ViewMode>("museum");
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(initialFilters.search || "");
  const [categoryId, setCategoryId] = useState(
    initialFilters.categoryId || ""
  );
  const [stockLocation, setStockLocation] = useState(
    initialFilters.stockLocation || ""
  );
  const [period, setPeriod] = useState(initialFilters.period || "");

  const applyFilters = useCallback(
    async (overrides?: Partial<typeof initialFilters>) => {
      const params = new URLSearchParams();
      const s = overrides?.search ?? search;
      const cat = overrides?.categoryId ?? categoryId;
      const loc = overrides?.stockLocation ?? stockLocation;
      const per = overrides?.period ?? period;

      if (s) params.set("search", s);
      if (cat) params.set("categoryId", cat);
      if (loc) params.set("stockLocation", loc);
      if (per) params.set("period", per);

      router.replace(`/catalogue?${params.toString()}`, { scroll: false });

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/listings?status=LIVE&${params.toString()}&limit=48`
        );
        const data = await res.json();
        setListings(data.listings || []);
      } finally {
        setIsLoading(false);
      }
    },
    [search, categoryId, stockLocation, period, router]
  );

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setStockLocation("");
    setPeriod("");
    router.replace("/catalogue", { scroll: false });
    applyFilters({
      search: "",
      categoryId: "",
      stockLocation: "",
      period: "",
    });
  };

  const hasActiveFilters =
    search || categoryId || stockLocation || period;

  const activeFilterCount = [search, categoryId, stockLocation, period].filter(
    Boolean
  ).length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 lg:px-8">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="gold-divider" />
          <span className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium">
            Galerie
          </span>
          <div className="gold-divider" />
        </div>
        <h1 className="font-serif text-4xl font-semibold text-center tracking-tight">
          Catalogue Complet
        </h1>
        <p className="text-muted-foreground text-center mt-2">
          {listings.length} objet{listings.length > 1 ? "s" : ""} disponible
          {listings.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une pièce, une période..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-white text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Effacer
            </Button>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-input p-0.5">
            <button
              onClick={() => setViewMode("museum")}
              className={`flex h-7 w-8 items-center justify-center rounded-sm transition-colors ${
                viewMode === "museum"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Vue Musée"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("masonry")}
              className={`flex h-7 w-8 items-center justify-center rounded-sm transition-colors ${
                viewMode === "masonry"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Vue Masonry"
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="rounded-md border border-border bg-stone-50 p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Catégorie
                  </label>
                  <Select
                    value={categoryId || "all"}
                    onValueChange={(v) => {
                      const val = v === "all" ? "" : v;
                      setCategoryId(val);
                      applyFilters({ categoryId: val });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Period */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Période
                  </label>
                  <Select
                    value={period || "all"}
                    onValueChange={(v) => {
                      const val = v === "all" ? "" : v;
                      setPeriod(val);
                      applyFilters({ period: val });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les périodes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les périodes</SelectItem>
                      {PERIOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Localisation
                  </label>
                  <Select
                    value={stockLocation || "all"}
                    onValueChange={(v) => {
                      const val = v === "all" ? "" : v;
                      setStockLocation(val);
                      applyFilters({ stockLocation: val });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les emplacements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les emplacements</SelectItem>
                      <SelectItem value="AT_RESIDENCE">
                        À la Résidence
                      </SelectItem>
                      <SelectItem value="AT_VENDOR">Chez le Vendeur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {search && (
                    <Badge variant="secondary" className="gap-1">
                      Recherche: {search}
                      <button
                        onClick={() => {
                          setSearch("");
                          applyFilters({ search: "" });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {categoryId && (
                    <Badge variant="secondary" className="gap-1">
                      {categories.find((c) => c.id === categoryId)?.name}
                      <button
                        onClick={() => {
                          setCategoryId("");
                          applyFilters({ categoryId: "" });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {period && (
                    <Badge variant="secondary" className="gap-1">
                      {period}
                      <button
                        onClick={() => {
                          setPeriod("");
                          applyFilters({ period: "" });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {stockLocation && (
                    <Badge variant="secondary" className="gap-1">
                      {stockLocation === "AT_RESIDENCE"
                        ? "À la Résidence"
                        : "Chez le Vendeur"}
                      <button
                        onClick={() => {
                          setStockLocation("");
                          applyFilters({ stockLocation: "" });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listings grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-sm bg-muted animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl text-muted-foreground mb-4">
            Aucun résultat
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Aucune pièce ne correspond à vos critères de recherche.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Effacer les filtres
          </Button>
        </div>
      ) : viewMode === "museum" ? (
        <div className="museum-grid">
          {listings.map((listing, i) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              index={i}
              variant="museum"
            />
          ))}
        </div>
      ) : (
        <Masonry
          breakpointCols={masonryBreakpoints}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
        >
          {listings.map((listing, i) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              index={i}
              variant="masonry"
            />
          ))}
        </Masonry>
      )}
    </div>
  );
}
