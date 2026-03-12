"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Zap,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function VendeurPaiementsContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // IBAN state
  const [iban, setIban] = useState("");
  const [bicSwift, setBicSwift] = useState("");
  const [bankName, setBankName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Stripe Connect state
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeOnboarded, setStripeOnboarded] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Charger IBAN
  useEffect(() => {
    fetch("/api/vendeur/paiements")
      .then((r) => r.json())
      .then((data) => {
        setIban(data.iban || "");
        setBicSwift(data.bicSwift || "");
        setBankName(data.bankName || "");
        setLoaded(true);
      });
  }, []);

  // Charger statut Stripe Connect
  useEffect(() => {
    fetch("/api/vendeur/stripe-status")
      .then((r) => r.json())
      .then((data) => {
        setStripeAccountId(data.stripeAccountId);
        setStripeOnboarded(data.stripeOnboarded);
        setStripeLoaded(true);
      });
  }, []);

  // Toast si retour depuis Stripe onboarding
  useEffect(() => {
    if (searchParams.get("stripe") === "connected" && stripeLoaded) {
      if (stripeOnboarded) {
        toast({ title: "Stripe Connect activé !", description: "Vos paiements seront versés automatiquement." });
      } else {
        toast({ title: "Configuration Stripe en cours", description: "Finalisez votre profil Stripe pour activer les virements automatiques." });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeLoaded]);

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      setConnectLoading(false);
    }
  };

  const handleStripeDashboard = async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/vendeur/paiements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iban, bicSwift, bankName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      toast({ title: "Coordonnées bancaires enregistrées" });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Paiements</h1>
        <p className="text-muted-foreground mt-1">
          Choisissez comment recevoir vos paiements après chaque vente.
        </p>
      </div>

      {/* Priorité active */}
      <div className="rounded-sm border border-border bg-stone-50 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Méthode active :</span>{" "}
        {stripeOnboarded
          ? "Stripe Express — virements automatiques"
          : iban
          ? "Virement SEPA manuel via votre IBAN"
          : "Aucune méthode configurée"}
      </div>

      {/* Section Stripe Connect */}
      <div className="rounded-sm border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-gold-500" />
          <h2 className="font-serif font-semibold">Stripe Express</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
            Recommandé
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Connectez un compte Stripe Express pour recevoir vos virements automatiquement dès qu&apos;un admin libère les fonds.
        </p>

        {!stripeLoaded ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : stripeOnboarded ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Compte Stripe connecté</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStripeDashboard}
              disabled={dashboardLoading}
              className="gap-2"
            >
              {dashboardLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Tableau de bord Stripe
            </Button>
          </div>
        ) : stripeAccountId ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Configuration incomplète</span>
            </div>
            <Button
              variant="gold"
              size="sm"
              onClick={handleConnectStripe}
              disabled={connectLoading}
              className="gap-2"
            >
              {connectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Continuer la configuration
            </Button>
          </div>
        ) : (
          <Button
            variant="gold"
            size="sm"
            onClick={handleConnectStripe}
            disabled={connectLoading}
            className="gap-2"
          >
            {connectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Connecter Stripe Express
          </Button>
        )}
      </div>

      {/* Séparateur */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        ou utiliser un virement SEPA manuel
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* IBAN form */}
      <form onSubmit={handleSubmit} className="rounded-sm border border-border bg-white p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-5 w-5 text-gold-500" />
          <h2 className="font-serif font-semibold">Virement SEPA (IBAN)</h2>
          {stripeOnboarded && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-stone-100 text-muted-foreground font-medium">
              Fallback si Stripe indisponible
            </span>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">
            IBAN <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase().replace(/\s/g, ""))}
            placeholder="FR7630006000011234567890189"
            required
            disabled={!loaded}
            className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-gold-400"
          />
          <p className="text-xs text-muted-foreground">Format : 2 lettres + 2 chiffres + jusqu&apos;à 30 caractères alphanumériques</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Code BIC / SWIFT</label>
          <input
            type="text"
            value={bicSwift}
            onChange={(e) => setBicSwift(e.target.value.toUpperCase())}
            placeholder="BNPAFRPPXXX"
            disabled={!loaded}
            className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-gold-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Nom de la banque</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="BNP Paribas"
            disabled={!loaded}
            className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-gold-400"
          />
        </div>

        <Button type="submit" variant="gold" disabled={saving || !loaded} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Enregistrement…" : saved ? "Enregistré !" : "Enregistrer"}
        </Button>
      </form>

      {/* Explication */}
      <div className="rounded-sm border border-border bg-white p-6 space-y-4">
        <h3 className="font-serif font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gold-500" />
          Comment fonctionne le séquestre ?
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          {[
            "L'acheteur paie le montant total à la plateforme.",
            "Les fonds sont retenus en séquestre sécurisé sur notre compte.",
            "Vous expédiez l'article et renseignez le numéro de suivi.",
            "L'acheteur confirme la réception et sa satisfaction.",
            "L'administrateur libère les fonds — automatiquement vers Stripe ou par virement SEPA si IBAN renseigné (commission de 15% déduite).",
          ].map((text, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-white text-xs font-bold">
                {i + 1}
              </span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-sm bg-amber-50 border border-amber-200 p-4 text-sm">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-amber-700">
          Assurez-vous que vos coordonnées bancaires sont correctes. Tout virement envoyé à un IBAN erroné ne pourra pas être récupéré automatiquement.
        </p>
      </div>
    </div>
  );
}

export default function VendeurPaiementsPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl space-y-4 animate-pulse"><div className="h-10 bg-muted rounded-sm" /><div className="h-40 bg-muted rounded-sm" /><div className="h-64 bg-muted rounded-sm" /></div>}>
      <VendeurPaiementsContent />
    </Suspense>
  );
}
