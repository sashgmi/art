"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Check,
  X,
  Edit3,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Home,
  MapPin,
} from "lucide-react";

interface Listing {
  id: string;
  slug: string;
  status: string;
  title: string;
  titleAdmin?: string | null;
  description: string;
  descriptionAdmin?: string | null;
  price: any;
  priceAdmin?: any;
  period?: string | null;
  origin?: string | null;
  stockLocation: string;
  submittedAt?: string | null;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  category?: { name: string } | null;
  vendor: {
    id: string;
    name: string | null;
    vendorProfile?: { businessName: string } | null;
  };
}

interface Props {
  listings: Listing[];
  categories: { id: string; name: string; slug: string }[];
}

const STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  PENDING_REVIEW: { label: "En attente", variant: "warning" },
  LIVE: { label: "En ligne", variant: "success" },
  DRAFT: { label: "Brouillon", variant: "default" },
  REVISION: { label: "En révision", variant: "warning" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
};

export default function AdminListingsClient({ listings: initial, categories }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [listings, setListings] = useState<Listing[]>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING_REVIEW");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Edit state per listing
  const [edits, setEdits] = useState<
    Record<
      string,
      {
        titleAdmin: string;
        descriptionAdmin: string;
        priceAdmin: string;
        adminNotes: string;
        rejectionReason: string;
      }
    >
  >({});

  const initEdit = (listing: Listing) => {
    setEdits((prev) => ({
      ...prev,
      [listing.id]: {
        titleAdmin: listing.titleAdmin || listing.title,
        descriptionAdmin: listing.descriptionAdmin || listing.description,
        priceAdmin: String(listing.priceAdmin || listing.price),
        adminNotes: listing.adminNotes || "",
        rejectionReason: listing.rejectionReason || "",
      },
    }));
    setEditingId(listing.id);
  };

  const updateListing = async (
    listingId: string,
    data: Record<string, any>
  ) => {
    setLoadingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const updated = await res.json();
      setListings((prev) =>
        prev.map((l) =>
          l.id === listingId ? { ...l, ...updated } : l
        )
      );
      return updated;
    } finally {
      setLoadingId(null);
    }
  };

  const handleApprove = async (listing: Listing) => {
    const edit = edits[listing.id];
    try {
      await updateListing(listing.id, {
        status: "LIVE",
        ...(edit?.titleAdmin !== listing.title
          ? { titleAdmin: edit?.titleAdmin }
          : {}),
        ...(edit?.descriptionAdmin !== listing.description
          ? { descriptionAdmin: edit?.descriptionAdmin }
          : {}),
        ...(edit?.priceAdmin && parseFloat(edit.priceAdmin) !== Number(listing.price)
          ? { priceAdmin: parseFloat(edit.priceAdmin) }
          : {}),
        ...(edit?.adminNotes ? { adminNotes: edit.adminNotes } : {}),
      });
      toast({ title: "Annonce approuvée et publiée !" });
      setEditingId(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleReject = async (listingId: string) => {
    const edit = edits[listingId];
    if (!edit?.rejectionReason) {
      toast({
        title: "Motif requis",
        description: "Indiquez la raison du refus",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateListing(listingId, {
        status: "REJECTED",
        rejectionReason: edit.rejectionReason,
      });
      toast({ title: "Annonce rejetée" });
      setEditingId(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleRequestRevision = async (listingId: string) => {
    const edit = edits[listingId];
    try {
      await updateListing(listingId, {
        status: "REVISION",
        adminNotes: edit?.adminNotes,
      });
      toast({ title: "Révision demandée au vendeur" });
      setEditingId(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const filteredListings = filterStatus === "ALL"
    ? listings
    : listings.filter((l) => l.status === filterStatus);

  const pendingCount = listings.filter((l) => l.status === "PENDING_REVIEW").length;

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: "ALL", label: "Toutes" },
          { value: "PENDING_REVIEW", label: `En attente (${pendingCount})` },
          { value: "LIVE", label: "En ligne" },
          { value: "REVISION", label: "En révision" },
          { value: "REJECTED", label: "Rejetées" },
          { value: "DRAFT", label: "Brouillons" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === tab.value
                ? "bg-foreground text-background"
                : "border border-border hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div className="space-y-3">
        {filteredListings.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            Aucune annonce dans cette catégorie
          </div>
        )}

        {filteredListings.map((listing) => {
          const isExpanded = expandedId === listing.id;
          const isEditing = editingId === listing.id;
          const isLoading = loadingId === listing.id;
          const edit = edits[listing.id];
          const statusMeta = STATUS_LABELS[listing.status] || {
            label: listing.status,
            variant: "default",
          };
          const vendorName =
            listing.vendor.vendorProfile?.businessName ||
            listing.vendor.name ||
            "Vendeur";

          return (
            <div
              key={listing.id}
              className="rounded-sm border border-border bg-white overflow-hidden"
            >
              {/* Header row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-stone-50"
                onClick={() =>
                  setExpandedId(isExpanded ? null : listing.id)
                }
              >
                {/* Thumbnail */}
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                  {listing.images[0] && (
                    <Image
                      src={listing.images[0].url}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">
                      {listing.titleAdmin || listing.title}
                    </p>
                    <Badge variant={statusMeta.variant} className="text-xs shrink-0">
                      {statusMeta.label}
                    </Badge>
                    {listing.stockLocation === "AT_RESIDENCE" ? (
                      <Badge variant="residence" className="text-xs shrink-0">
                        <Home className="h-2.5 w-2.5" /> Résidence
                      </Badge>
                    ) : (
                      <Badge variant="vendor" className="text-xs shrink-0">
                        <MapPin className="h-2.5 w-2.5" /> Vendeur
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {vendorName}
                    {listing.submittedAt &&
                      ` · Soumis le ${formatDate(listing.submittedAt)}`}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="font-serif font-semibold text-sm">
                    {formatPrice(
                      Number(listing.priceAdmin || listing.price)
                    )}
                  </p>
                  {listing.category && (
                    <p className="text-xs text-muted-foreground">
                      {listing.category.name}
                    </p>
                  )}
                </div>

                {/* Expand icon */}
                <div className="shrink-0 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-5">
                  {/* Image gallery */}
                  <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                    {listing.images.map((img) => (
                      <div
                        key={img.id}
                        className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-sm bg-muted"
                      >
                        <Image
                          src={img.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                        {img.isPrimary && (
                          <div className="absolute top-1 left-1 rounded bg-black/60 px-1 py-0.5 text-white text-[9px]">
                            Principale
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditing ? (
                    /* EDIT MODE */
                    <div className="space-y-4">
                      <div className="rounded-sm bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-xs text-amber-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        Les modifications ci-dessous seront affichées à la place
                        du texte original du vendeur.
                      </div>

                      <div>
                        <Label>Titre (modification admin)</Label>
                        <Input
                          value={edit?.titleAdmin || ""}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [listing.id]: {
                                ...prev[listing.id],
                                titleAdmin: e.target.value,
                              },
                            }))
                          }
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Original: {listing.title}
                        </p>
                      </div>

                      <div>
                        <Label>Description (modification admin)</Label>
                        <Textarea
                          value={edit?.descriptionAdmin || ""}
                          rows={8}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [listing.id]: {
                                ...prev[listing.id],
                                descriptionAdmin: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 font-mono text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Prix modifié (€)</Label>
                          <Input
                            type="number"
                            value={edit?.priceAdmin || ""}
                            onChange={(e) =>
                              setEdits((prev) => ({
                                ...prev,
                                [listing.id]: {
                                  ...prev[listing.id],
                                  priceAdmin: e.target.value,
                                },
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Notes internes (non visibles)</Label>
                          <Input
                            value={edit?.adminNotes || ""}
                            onChange={(e) =>
                              setEdits((prev) => ({
                                ...prev,
                                [listing.id]: {
                                  ...prev[listing.id],
                                  adminNotes: e.target.value,
                                },
                              }))
                            }
                            placeholder="Notes privées pour l'équipe..."
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Motif de refus (si rejet)</Label>
                        <Textarea
                          value={edit?.rejectionReason || ""}
                          rows={2}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [listing.id]: {
                                ...prev[listing.id],
                                rejectionReason: e.target.value,
                              },
                            }))
                          }
                          placeholder="Expliquez au vendeur pourquoi l'annonce est refusée..."
                          className="mt-1"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestRevision(listing.id)}
                          disabled={isLoading}
                        >
                          Demander révision
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(listing.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Rejeter
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
                          onClick={() => handleApprove(listing)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approuver & Publier
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* READ MODE */
                    <div className="space-y-4">
                      {/* Original text */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Description du vendeur
                        </p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-4">
                          {listing.description}
                        </p>
                        {listing.descriptionAdmin && (
                          <div className="mt-2 rounded-sm bg-blue-50 border border-blue-200 p-3">
                            <p className="text-xs font-medium text-blue-800 mb-1">
                              Version admin
                            </p>
                            <p className="text-xs text-blue-700 whitespace-pre-wrap line-clamp-3">
                              {listing.descriptionAdmin}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons for pending listings */}
                      {listing.status === "PENDING_REVIEW" && (
                        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => initEdit(listing)}
                          >
                            <Edit3 className="h-4 w-4" />
                            Modifier avant approbation
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
                            onClick={async () => {
                              try {
                                await updateListing(listing.id, {
                                  status: "LIVE",
                                });
                                toast({ title: "Annonce publiée !" });
                              } catch (err: any) {
                                toast({
                                  title: "Erreur",
                                  description: err.message,
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Approuver rapidement
                          </Button>
                        </div>
                      )}

                      {listing.status !== "PENDING_REVIEW" && (
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => initEdit(listing)}
                          >
                            <Edit3 className="h-4 w-4" />
                            Modifier
                          </Button>
                          <a
                            href={`/catalogue/${listing.slug}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                              Voir la page
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
