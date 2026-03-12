"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gem, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-sm bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Adresse email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
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
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Se connecter"
        )}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-16 lg:px-16 max-w-lg mx-auto w-full">
        <div className="mb-10">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Gem className="h-5 w-5 text-gold-500" />
            <span className="font-serif text-lg font-semibold">
              Galerie Antiquités
            </span>
          </Link>
          <h1 className="font-serif text-3xl font-semibold">Connexion</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenue. Connectez-vous à votre compte.
          </p>
        </div>

        <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded-sm" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-foreground underline">
            S&apos;inscrire
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-8 rounded-sm bg-stone-50 border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Comptes de démonstration
          </p>
          <div className="space-y-1 text-xs text-muted-foreground font-mono">
            <p>Admin: admin@galerie-antiquites.fr / admin123!</p>
            <p>Vendeur: vendeur@galerie-antiquites.fr / vendeur123!</p>
            <p>Acheteur: acheteur@test.fr / acheteur123!</p>
          </div>
        </div>
      </div>

      {/* Right: Image */}
      <div
        className="hidden lg:block flex-1 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&q=90')",
        }}
      />
    </div>
  );
}
