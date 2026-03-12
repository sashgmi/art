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
import {
  Upload,
  X,
  Loader2,
  GripVertical,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UploadedImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
  preview?: string;
  order: number;
}

interface Props {
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

export default function NewListingForm({ categories }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    provenance: "",
    price: "",
    period: "",
    origin: "",
    dimensions: "",
    weight: "",
    condition: "",
    materials: "",
    categoryId: "",
    stockLocation: "AT_VENDOR" as "AT_VENDOR" | "AT_RESIDENCE",
    shippingAvailable: true,
    shippingCost: "",
    shippingDetails: "",
    pickupAvailable: false,
  });

  // ── Cloudinary upload ──────────────────────────────────────
  const uploadToCloudinary = async (file: File, draftId?: string): Promise<UploadedImage> => {
    // 1. Get signed params from server
    const sigRes = await fetch("/api/upload/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: draftId || "draft" }),
    });
    const params = await sigRes.json();

    // 2. Upload directly to Cloudinary
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
      preview: undefined,
      order: images.length,
    };
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > 8) {
        toast({
          title: "Limite atteinte",
          description: "Maximum 8 photos par annonce",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      try {
        const newImages = await Promise.all(
          acceptedFiles.map((file) => uploadToCloudinary(file))
        );
        setImages((prev) => [...prev, ...newImages]);
        toast({ title: `${newImages.length} photo(s) uploadée(s)` });
      } catch {
        toast({
          title: "Erreur d'upload",
          description: "Impossible d'uploader les images",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [images.length, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024, // 10MB
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
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index }))
    );
  };

  // ── Form submit ────────────────────────────────────────────
  const handleSubmit = async (
    action: "save_draft" | "submit_for_review"
  ) => {
    if (images.length === 0) {
      toast({
        title: "Photos requises",
        description: "Ajoutez au moins une photo",
        variant: "destructive",
      });
      return;
    }

    if (!form.title || !form.description || !form.price) {
      toast({
        title: "Champs manquants",
        description: "Titre, description et prix sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create listing
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          shippingCost: form.shippingCost
            ? parseFloat(form.shippingCost)
            : undefined,
          images: images.map((img) => ({
            url: img.url,
            publicId: img.publicId,
            isPrimary: img.isPrimary,
            order: img.order,
          })),
        }),
      });

      const listing = await res.json();
      if (!res.ok) throw new Error(listing.error);

      // Submit for review if requested
      if (action === "submit_for_review") {
        await fetch(`/api/listings/${listing.id}/submit`, {
          method: "POST",
        });
      }

      toast({
        title:
          action === "submit_for_review"
            ? "Annonce soumise pour validation !"
            : "Brouillon enregistré",
        description:
          action === "submit_for_review"
            ? "L'administrateur examinera votre annonce."
            : "",
      });

      router.push("/vendeur/annonces");
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section: Photos */}
      <section className="rounded-sm border border-border bg-white p-6">
        <h2 className="font-serif font-semibold mb-1">
          Photos <span className="text-destructive">*</span>
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Jusqu&apos;à 8 photos. La première sera la photo principale.
          Formats: JPG, PNG, WEBP. Max 10 Mo par image.
        </p>

        {/* Upload zone */}
        <div
          {...getRootProps()}
          className={`relative rounded-sm border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-foreground bg-stone-50"
              : "border-border hover:border-muted-foreground"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Upload en cours...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Glissez vos photos ou cliquez pour parcourir
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WEBP — Max 10 Mo
              </p>
            </div>
          )}
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {images.map((img, i) => (
              <div key={img.publicId} className="relative group">
                <div className="relative aspect-square rounded-sm overflow-hidden bg-muted">
                  <Image
                    src={img.url}
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
                      className="rounded bg-white/90 px-1.5 py-1 text-[10px] font-medium"
                    >
                      Principale
                    </button>
                  )}
                  <button
                    onClick={() => removeImage(i)}
                    className="rounded bg-white/90 p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section: Description */}
      <section className="rounded-sm border border-border bg-white p-6 space-y-4">
        <h2 className="font-serif font-semibold">
          Description <span className="text-destructive">*</span>
        </h2>

        <div>
          <Label htmlFor="title">
            Titre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            required
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="ex: Commode Louis XV en marqueterie, vers 1755"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="categoryId">Catégorie</Label>
            <Select
              value={form.categoryId || "none"}
              onValueChange={(v) =>
                setForm({ ...form, categoryId: v === "none" ? "" : v })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Aucune —</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="period">Période</Label>
            <Select
              value={form.period || "none"}
              onValueChange={(v) =>
                setForm({ ...form, period: v === "none" ? "" : v })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Aucune —</SelectItem>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">
            Description détaillée <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            required
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Décrivez l'objet en détail : style, époque, état, restaurations, particularités..."
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
            placeholder="Indiquez l'historique de propriété si connu..."
            className="mt-1"
          />
        </div>
      </section>

      {/* Section: Details */}
      <section className="rounded-sm border border-border bg-white p-6 space-y-4">
        <h2 className="font-serif font-semibold">Caractéristiques</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="origin">Origine géographique</Label>
            <Input
              id="origin"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              placeholder="ex: Paris, France"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              value={form.dimensions}
              onChange={(e) =>
                setForm({ ...form, dimensions: e.target.value })
              }
              placeholder="ex: H: 87cm, L: 122cm, P: 58cm"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="materials">Matériaux</Label>
            <Input
              id="materials"
              value={form.materials}
              onChange={(e) =>
                setForm({ ...form, materials: e.target.value })
              }
              placeholder="ex: Acajou, bronze doré"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="weight">Poids</Label>
            <Input
              id="weight"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              placeholder="ex: 12 kg"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="condition">État de conservation</Label>
          <Input
            id="condition"
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
            placeholder="ex: Très bon état, restaurations d'époque"
            className="mt-1"
          />
        </div>
      </section>

      {/* Section: Pricing & location */}
      <section className="rounded-sm border border-border bg-white p-6 space-y-4">
        <h2 className="font-serif font-semibold">Prix & Localisation</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">
              Prix (€) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              required
              min={0}
              step={1}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="12500"
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
                  onClick={() =>
                    setForm({
                      ...form,
                      stockLocation: opt.value as
                        | "AT_VENDOR"
                        | "AT_RESIDENCE",
                    })
                  }
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

        {/* Shipping */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shippingAvailable"
              checked={form.shippingAvailable}
              onChange={(e) =>
                setForm({ ...form, shippingAvailable: e.target.checked })
              }
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="shippingAvailable">
              Expédition disponible
            </Label>
          </div>

          {form.shippingAvailable && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <Label htmlFor="shippingCost">
                  Frais de livraison (€)
                </Label>
                <Input
                  id="shippingCost"
                  type="number"
                  min={0}
                  step={1}
                  value={form.shippingCost}
                  onChange={(e) =>
                    setForm({ ...form, shippingCost: e.target.value })
                  }
                  placeholder="0 = inclus"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="shippingDetails">
                  Précisions sur l&apos;expédition
                </Label>
                <Input
                  id="shippingDetails"
                  value={form.shippingDetails}
                  onChange={(e) =>
                    setForm({ ...form, shippingDetails: e.target.value })
                  }
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
              onChange={(e) =>
                setForm({ ...form, pickupAvailable: e.target.checked })
              }
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="pickupAvailable">
              Remise en main propre possible
            </Label>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => handleSubmit("save_draft")}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Enregistrer comme brouillon"
          )}
        </Button>
        <Button
          type="button"
          variant="gold"
          disabled={submitting}
          onClick={() => handleSubmit("submit_for_review")}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Soumettre pour validation →"
          )}
        </Button>
      </div>
    </div>
  );
}
