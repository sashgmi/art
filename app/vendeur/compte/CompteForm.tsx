"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import {
  Save,
  CheckCircle,
  Loader2,
  Lock,
  BarChart2,
  ShieldCheck,
} from "lucide-react";

interface Profile {
  businessName: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  siret: string | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  totalSales: number;
  totalRevenue: number;
  rating: number | null;
}

interface Props {
  profile: Profile;
  userName: string | null;
  userEmail: string | null;
}

function inputClass(extra = "") {
  return `w-full rounded-sm border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-gold-400 ${extra}`;
}

export default function CompteForm({ profile, userName, userEmail }: Props) {
  const { toast } = useToast();

  // Profil
  const [form, setForm] = useState({
    businessName: profile.businessName,
    description: profile.description ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    country: profile.country,
    siret: profile.siret ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Mot de passe
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/vendeur/compte", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      toast({ title: "Profil mis à jour" });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/vendeur/compte/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pwForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Mot de passe modifié" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Mon compte</h1>
        <p className="text-muted-foreground mt-1">
          {userName} · {userEmail}
        </p>
      </div>

      {/* Statut vérification */}
      <div
        className={`flex items-center gap-3 rounded-sm border p-4 ${
          profile.isVerified
            ? "border-emerald-200 bg-emerald-50"
            : "border-border bg-stone-50"
        }`}
      >
        <ShieldCheck
          className={`h-5 w-5 shrink-0 ${
            profile.isVerified ? "text-emerald-600" : "text-muted-foreground"
          }`}
        />
        <div>
          <p className={`text-sm font-medium ${profile.isVerified ? "text-emerald-800" : "text-foreground"}`}>
            {profile.isVerified ? "Compte vérifié" : "Compte en attente de vérification"}
          </p>
          {profile.isVerified && profile.verifiedAt && (
            <p className="text-xs text-emerald-700 mt-0.5">
              Vérifié le{" "}
              {new Date(profile.verifiedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ventes totales", value: profile.totalSales },
          { label: "Revenus totaux", value: formatPrice(Number(profile.totalRevenue)) },
          { label: "Note moyenne", value: profile.rating ? `${profile.rating.toFixed(1)} / 5` : "—" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-sm border border-border bg-white p-4 text-center">
            <p className="font-serif text-2xl font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profil vendeur */}
      <form
        onSubmit={handleProfileSubmit}
        className="rounded-sm border border-border bg-white p-6 space-y-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 className="h-5 w-5 text-gold-500" />
          <h2 className="font-serif font-semibold">Profil vendeur</h2>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Nom de l&apos;activité <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            required
            className={inputClass()}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className={inputClass("resize-none")}
            placeholder="Décrivez votre activité, votre spécialité…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass()}
              placeholder="+33 6 12 34 56 78"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">SIRET</label>
            <input
              type="text"
              value={form.siret}
              onChange={(e) => setForm({ ...form, siret: e.target.value })}
              className={inputClass()}
              placeholder="12345678901234"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Adresse</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={inputClass()}
            placeholder="12 rue des Arts"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputClass()}
              placeholder="Paris"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Pays</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className={inputClass()}
            />
          </div>
        </div>

        <Button type="submit" variant="gold" disabled={saving} className="gap-2">
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

      {/* Changer mot de passe */}
      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-sm border border-border bg-white p-6 space-y-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-gold-500" />
          <h2 className="font-serif font-semibold">Sécurité</h2>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Mot de passe actuel</label>
          <input
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            required
            className={inputClass()}
            placeholder="••••••••"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nouveau mot de passe</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required
              minLength={8}
              className={inputClass()}
              placeholder="8 caractères minimum"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Confirmer</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              required
              className={inputClass()}
              placeholder="••••••••"
            />
          </div>
        </div>

        <Button type="submit" variant="outline" disabled={pwSaving} className="gap-2">
          {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {pwSaving ? "Modification…" : "Changer le mot de passe"}
        </Button>
      </form>
    </div>
  );
}
