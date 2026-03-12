"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gem, Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "BUYER" as "BUYER" | "VENDOR",
    businessName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");

      // Auto sign in
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      router.push(form.role === "VENDOR" ? "/vendeur" : "/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex flex-1 flex-col justify-center px-8 py-16 lg:px-16 max-w-lg mx-auto w-full">
        <div className="mb-10">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Gem className="h-5 w-5 text-gold-500" />
            <span className="font-serif text-lg font-semibold">
              Galerie Antiquités
            </span>
          </Link>
          <h1 className="font-serif text-3xl font-semibold">Créer un compte</h1>
          <p className="text-muted-foreground mt-2">
            Rejoignez notre communauté de collectionneurs et d&apos;experts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-sm bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "BUYER", label: "Acheteur", desc: "Je souhaite acheter" },
              { value: "VENDOR", label: "Vendeur", desc: "Je souhaite vendre" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setForm({ ...form, role: opt.value as "BUYER" | "VENDOR" })
                }
                className={`rounded-sm border p-3 text-left transition-colors ${
                  form.role === opt.value
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.desc}</div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Marie Dupont"
            />
          </div>

          {form.role === "VENDOR" && (
            <div className="space-y-2">
              <Label htmlFor="businessName">Nom de votre enseigne</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) =>
                  setForm({ ...form, businessName: e.target.value })
                }
                placeholder="Antiquités Dupont"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vous@exemple.fr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="8 caractères minimum"
            />
          </div>

          <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-foreground underline">
            Se connecter
          </Link>
        </p>
      </div>

      <div
        className="hidden lg:block flex-1 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=90')",
        }}
      />
    </div>
  );
}
