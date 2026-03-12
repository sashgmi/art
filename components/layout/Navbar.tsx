"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Search,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Gem,
  ShoppingBag,
} from "lucide-react";

const navLinks = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/categories", label: "Catégories" },
  { href: "/provenance", label: "Provenance & Garanties" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/catalogue?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  }

  return (
    <header className="fixed top-0 z-50 w-full bg-white border-b border-border">
      <nav className="container mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-8">

        {/* ── Logo ───────────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
          onClick={() => setIsOpen(false)}
        >
          <Gem className="h-5 w-5 text-gold-500" />
          <span className="font-serif text-lg font-semibold tracking-wide text-foreground group-hover:text-gold-600 transition-colors whitespace-nowrap">
            Galerie Antiquités
          </span>
        </Link>

        {/* ── Search bar (desktop) ────────────────────── */}
        <form
          onSubmit={handleSearch}
          className="hidden lg:flex flex-1 max-w-xl mx-auto"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une antiquité, une œuvre d'art…"
              className="w-full rounded-sm border border-border bg-muted/40 pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-gold-400 transition"
            />
          </div>
        </form>

        {/* ── Desktop nav + actions ───────────────────── */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors whitespace-nowrap",
                pathname === link.href
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* Divider */}
          <div className="h-5 w-px bg-border" />

          {session ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold">
                  {session.user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-sm border bg-white p-1.5 shadow-lg">
                    <div className="px-3 py-2 text-xs text-muted-foreground border-b mb-1">
                      <div className="font-medium text-foreground">{session.user?.name}</div>
                      <div>{session.user?.email}</div>
                    </div>

                    {session.user?.role === "ADMIN" && (
                      <Link href="/admin" onClick={() => setProfileOpen(false)}>
                        <div className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />
                          Tableau de bord Admin
                        </div>
                      </Link>
                    )}
                    {session.user?.role === "VENDOR" && (
                      <Link href="/vendeur" onClick={() => setProfileOpen(false)}>
                        <div className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />
                          Espace Vendeur
                        </div>
                      </Link>
                    )}
                    {(session.user?.role === "BUYER" || session.user?.role === "ADMIN") && (
                      <Link href="/compte/commandes" onClick={() => setProfileOpen(false)}>
                        <div className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                          <ShoppingBag className="h-4 w-4" />
                          Mes commandes
                        </div>
                      </Link>
                    )}
                    <Link href="/compte" onClick={() => setProfileOpen(false)}>
                      <div className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                        <User className="h-4 w-4" />
                        Mon compte
                      </div>
                    </Link>
                    <div className="border-t mt-1 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-destructive/5 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/connexion">
                <Button variant="ghost" size="sm">Connexion</Button>
              </Link>
              <Link href="/inscription">
                <Button size="sm" variant="gold">S&apos;inscrire</Button>
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile: search icon + hamburger ─────────── */}
        <div className="flex items-center gap-2 ml-auto lg:hidden">
          <Link href="/catalogue">
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
            </button>
          </Link>
          <button
            className="p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ─────────────────────────────── */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b shadow-md">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-sm border border-border bg-muted/40 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
            </div>
          </form>

          <div className="container px-4 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block rounded-sm px-3 py-2 text-sm hover:bg-muted",
                  pathname === link.href && "font-medium"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t pt-3 mt-3 flex flex-col gap-2">
              {session ? (
                <>
                  <div className="px-3 text-sm text-muted-foreground">{session.user?.name}</div>
                  {session.user?.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Tableau de bord Admin</Button>
                    </Link>
                  )}
                  {session.user?.role === "VENDOR" && (
                    <Link href="/vendeur" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Espace Vendeur</Button>
                    </Link>
                  )}
                  {(session.user?.role === "BUYER" || session.user?.role === "ADMIN") && (
                    <Link href="/compte/commandes" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Mes commandes</Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                    Se déconnecter
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/connexion" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Connexion</Button>
                  </Link>
                  <Link href="/inscription" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="w-full">S&apos;inscrire</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
