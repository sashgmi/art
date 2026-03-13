"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Star } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ExistingImage {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  publicId: string;
  isPrimary: boolean;
  order: number;
}

interface NewImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
  order: number;
}

type ImageEntry = (ExistingImage & { _type: "existing" }) | (NewImage & { _type: "new" });

interface ListingData {
  id: string;
  title: string;
  description: string;
  provenance: string;
  price: number;
  period: string;
  origin: string;
  dimensions: string;
  weight: string;
  condition: string;
  materials: string;
  categoryId: string;
  stockLocation: "AT_VENDOR" | "AT_RESIDENCE";
  shippingAvailable: boolean;
  shippingCost: number;
  shippingDetails: string;
  pickupAvailable: boolean;
  status: string;
  images: ExistingImage[];
}

interface Props {
  listing: ListingData;
  categories: Category[];
}

const PERIODS = [
  "XVIe siècle",
  "XVIIe siècle",
  "XVIIIe siècle",
  "XIXe siècle",
  "Art Déco (1920-1940)",
  "Art Nouveau",
  "XXe siècle",
  "Contemporain",
];

export default function EditListingForm({ listing, categories }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [images, setImages] = useState<ImageEntry[]>(
    listing.images.map((img) => ({ ...img, _type: "existing" as const }))
  );

  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description,
    provenance: listing.provenance,
    price: listing.price.toString(),
    period: listing.period,
    origin: listing.origin,
    dimensions: listing.dimensions,
    weight: listing.weight,
    condition: listing.condition,
    materials: listing.materials,
    categoryId: listing.categoryId,
    stockLocation: listing.stockLocation,
    shippingAvailable: listing.shippingAvailable,
    shippingCost: listing.shippingCost ? listing.shippingCost.toString() : "",
    shippingDetails: listing.shippingDetails,
    pickupAvailable: listing.pickupAvailable,
  });

  // ── Cloudinary upload ──────────────────────────────────────
  const uploadToCloudinary = async (file: File): Promise<NewImage> => {
    const sigRes = await fetch("/api/upload/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id }),
    });
    const params = await sigRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", params.apiKey);
    formData.append("timestamp", params.timestamp.toString());
    formData.append("signature", params.signature);
    formData.append("folder", params.folder);
    formData.append("eager", params.eager);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const result = await uploadRes.json();

    return {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: images.length === 0,
      order: images.length,
    };
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > 8) {
        toast({ title: "Maximum 8 photos par annonce", variant: "destructive" });
        return;
      }
      setUploading(true);
      try {
        const newImgs = await Promise.all(acceptedFiles.map(uploadToCloudinary));
        setImages((prev) => [
          ...prev,
          ...newImgs.map((img) => ({ ...img, _type: "new" as const })),
        ]);
        toast({ title: `${newImgs.length} photo(s) ajoutée(s)` });
      } catch {
        toast({ title: "Erreur d'upload", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [images.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next.map((img, i) => ({ ...img, order: i }));
    });
  };

  const setPrimary = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (images.length === 0) {
      toast({ title: "Au moins une photo est requise", variant: "destructive" });
      return;
    }
    if (!form.title || !form.description || !form.price) {
      toast({ title: "Titre, description et prix sont obligatoires", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const keepImageIds = images
        .filter((img) => img._type === "existing")
        .map((img) => (img as ExistingImage & { _type: "existing" }).id);

      const newImages = images
        .filter((img) => img._type === "new")
        .map((img) => ({
          url: img.url,
          publicId: img.publicId,
          isPrimary: img.isPrimary,
          order: img.order,
        }));

      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          shippingCost: form.shippingCost ? parseFloat(form.shippingCost) : undefined,
          keepImageIds,
          newImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: listing.status === "LIVE"
          ? "Modifications enregistrées — annonce soumise à validation"
          : "Modifications enregistrées",
      });
      router.push("/vendeur/annonces");
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Photos */}
      <section className="rounded-sm border border-border bg-white p-6">
        <h2 className="font-serif font-semibold mb-1">Photos</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Jusqu&apos;à 8 photos. Cliquez sur une photo pour la définir comme principale.
        </p>

        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            {images.map((img, i) => (
              <div key={img.publicId + i} className="relative group">
                <div className="relative aspect-square rounded-sm overflow-hidden bg-muted">
                  <Image
                    src={img._type === "existing" ? (img.thumbnailUrl || img.url) : img.url}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                  {img.isPrimary && (
                    <div className="absolute top-1 left-1 rounded bg-foreground/80 px-1.5 py-0.5 text-white text-[10px]">
                      Principale
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 bg-black/40 rounded-sm transition-opacity">
                  {!img.isPrimary && (
                    <button
                      onClick={() => setPrimary(i)}
                      className="rounded bg-white/90 p-1"
                      title="Définir comme principale"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button onClick={() => removeImage(i)} className="rounded bg-white/90 p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          {...getRootProps()}
          className={`relative rounded-sm border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-foreground bg-stone-50" : "border-border hover:border-muted-foreground"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm">Ajouter des photos</p>
            </div>
          )}
        </div>
      </section>

      {/* Description */}
      <section className="rounded-sm border border-border bg-white p-6 space-y-4">
        <h2 className="font-serif font-semibold">Description</h2>

        <div>
          <Label htmlFor="title">Titre <span className="text-destructive">*</span></Label>
          <Input
            id="title"
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Catégorie</Label>
            <Select
              value={form.categoryId || "none"}
              onValueChange={(v) => setForm({ ...form, categoryId: v === "none" ? "" : v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Aucune —</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Période</Label>
            <Select
              value={form.period || "none"}
              onValueChange={(v) => setForm({ ...form, period: v === "none" ? "" : v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Aucune —</SelectItem>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
          <Textarea
            id="description"
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="provenance">Provenance</Label>
          <Textarea
            id="provenance"
            rows={3}
            value={form.provenance}
            onChange={(e) => setForm({ ...form, provenance: e.target.value })}
            className="mt-1"
          />
        </div>
      </section>

      {/* Caractéristiques */}
      <section className="rounded-sm border border-border bg-white p-6 space-y-4">
        <h2 className="font-serif font-semibold">Caractéristiques</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Origine géographique</Label>
            <Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Dimensions</Label>
            <Input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} className="mt-1" placeholder="ex: H: 87cm, L: 122cm" />
          </div>
          <div>
            <Label>Matériaux</Label>
            <Input value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Poids</Label>
            <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="mt-1" placeholder="ex: 12 kg" />
          </div>
        </div>
        <div>
          <Label>État de conservation</Label>
          <Input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="mt-1" />
        </div>
      </section>

      {/* Prix & Localisation */}
      <section className="rounded-sm border border-border bg-white p-6 space-y-4">
        <h2 className="font-serif font-semibold">Prix & Localisation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Prix (€) <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Localisation du stock</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { value: "AT_VENDOR", label: "Chez moi" },
                { value: "AT_RESIDENCE", label: "À la résidence" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, stockLocation: opt.value as "AT_VENDOR" | "AT_RESIDENCE" })}
                  className={`rounded-sm border p-2 text-sm transition-colors ${
                    form.stockLocation === opt.value
                      ? "border-foreground bg-foreground/5 font-medium"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shippingAvailable"
              checked={form.shippingAvailable}
              onChange={(e) => setForm({ ...form, shippingAvailable: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="shippingAvailable">Expédition disponible</Label>
          </div>
          {form.shippingAvailable && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <Label>Frais de livraison (€)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.shippingCost}
                  onChange={(e) => setForm({ ...form, shippingCost: e.target.value })}
                  placeholder="0 = inclus"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Précisions</Label>
                <Input
                  value={form.shippingDetails}
                  onChange={(e) => setForm({ ...form, shippingDetails: e.target.value })}
                  placeholder="ex: Colissimo assuré"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pickupAvailable"
              checked={form.pickupAvailable}
              onChange={(e) => setForm({ ...form, pickupAvailable: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="pickupAvailable">Remise en main propre possible</Label>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/vendeur/annonces")} disabled={submitting}>
          Annuler
        </Button>
        <Button variant="gold" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
}
