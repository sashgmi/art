"use client";

import React, { useState } from "react";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { Shield, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface ListingMini {
  id: string;
  title: string;
  price: number;
  shippingCost: number | null;
  images: { url: string }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  listing: ListingMini;
}

// ── Step 1: Shipping address form ──────────────────────────────
function ShippingForm({
  onNext,
  listing,
}: {
  onNext: (clientSecret: string, fees: any) => void;
  listing: ListingMini;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          shippingAddress: {
            ...form,
            country: "FR",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");

      onNext(data.clientSecret, data.fees);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const total =
    listing.price + (listing.shippingCost || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="font-serif text-lg font-semibold mb-1">
          Adresse de livraison
        </h3>
        <p className="text-sm text-muted-foreground">
          Où souhaitez-vous recevoir votre acquisition ?
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jean Dupont"
          />
        </div>
        <div>
          <Label htmlFor="line1">Adresse</Label>
          <Input
            id="line1"
            required
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            placeholder="12 rue de la Paix"
          />
        </div>
        <div>
          <Label htmlFor="line2">Complément (optionnel)</Label>
          <Input
            id="line2"
            value={form.line2}
            onChange={(e) => setForm({ ...form, line2: e.target.value })}
            placeholder="Appartement, bâtiment..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              required
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              placeholder="75001"
            />
          </div>
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Paris"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-sm bg-stone-50 border border-border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sous-total</span>
          <span>{formatPrice(listing.price)}</span>
        </div>
        {listing.shippingCost && listing.shippingCost > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Livraison</span>
            <span>{formatPrice(listing.shippingCost)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Continuer vers le paiement →"
        )}
      </Button>
    </form>
  );
}

// ── Step 2: Stripe payment form ───────────────────────────────
function PaymentForm({
  fees,
  onSuccess,
}: {
  fees: any;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/commande/confirmation`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Paiement refusé",
        description: error.message || "Erreur de paiement",
        variant: "destructive",
      });
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="font-serif text-lg font-semibold mb-1">
          Informations de paiement
        </h3>
        <p className="text-sm text-muted-foreground">
          Vos fonds seront sécurisés en séquestre jusqu&apos;à livraison
          confirmée.
        </p>
      </div>

      <div className="rounded-sm border border-border p-4">
        <PaymentElement />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-50 border border-emerald-100 rounded-sm p-3">
        <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        Paiement sécurisé par Stripe. Fonds retenus jusqu&apos;à votre
        confirmation de réception.
      </div>

      <div className="rounded-sm bg-stone-50 border border-border p-4 text-sm">
        <div className="flex justify-between font-semibold">
          <span>Total à payer</span>
          <span>{formatPrice(fees?.total || 0)}</span>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        variant="gold"
        className="w-full"
        disabled={loading || !stripe}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          `Payer ${formatPrice(fees?.total || 0)}`
        )}
      </Button>
    </form>
  );
}

// ── Success state ─────────────────────────────────────────────
function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <Shield className="h-8 w-8 text-emerald-600" />
        </div>
      </div>
      <h3 className="font-serif text-2xl font-semibold">
        Commande confirmée !
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
        Votre paiement est sécurisé en séquestre. Le vendeur sera notifié et
        vous recevrez un email de confirmation.
      </p>
      <Button onClick={onClose} className="mt-4">
        Fermer
      </Button>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────
export default function CheckoutModal({ open, onClose, listing }: Props) {
  const [step, setStep] = useState<"shipping" | "payment" | "success">(
    "shipping"
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fees, setFees] = useState<any>(null);

  if (!open) return null;

  const handleShippingNext = (secret: string, feesData: any) => {
    setClientSecret(secret);
    setFees(feesData);
    setStep("payment");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-md bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            {listing.images[0] && (
              <div className="relative h-12 w-12 rounded-sm overflow-hidden bg-muted">
                <Image
                  src={listing.images[0].url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="font-serif font-semibold text-sm line-clamp-1">
                {listing.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(listing.price)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps indicator */}
        {step !== "success" && (
          <div className="flex border-b">
            {["shipping", "payment"].map((s, i) => (
              <div
                key={s}
                className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
                  step === s
                    ? "border-b-2 border-foreground text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {i + 1}. {s === "shipping" ? "Livraison" : "Paiement"}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {step === "shipping" && (
            <ShippingForm onNext={handleShippingNext} listing={listing} />
          )}

          {step === "payment" && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { fontFamily: "Cormorant Garamond, serif" },
                },
              }}
            >
              <PaymentForm
                fees={fees}
                onSuccess={() => setStep("success")}
              />
            </Elements>
          )}

          {step === "success" && <SuccessView onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}
