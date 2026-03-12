"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Star } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Subtle gold top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

      {/* Light decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(212,145,26,0.06),transparent)]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Eyebrow */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gold-400" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium">
              Art & Antiquités d&apos;Exception
            </span>
            <div className="h-px w-12 bg-gold-400" />
          </div>

          {/* Title */}
          <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl mb-6 text-foreground">
            Chaque Pièce
            <br />
            <span className="italic font-light text-gold-600">
              Raconte une Histoire
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed mb-10">
            Découvrez notre sélection exclusive d&apos;antiquités et
            d&apos;œuvres d&apos;art, certifiées par nos experts, avec
            paiement sécurisé en séquestre.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/catalogue">
              <Button
                size="xl"
                className="bg-foreground text-background hover:bg-foreground/90 group min-w-[200px]"
              >
                Explorer le Catalogue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/provenance">
              <Button
                size="xl"
                variant="outline"
                className="min-w-[200px] border-border text-foreground hover:bg-muted"
              >
                Nos Garanties
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gold-500" />
            <span>Paiement 100% sécurisé</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-border" />
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-gold-500" />
            <span>Articles certifiés experts</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-border" />
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-gold-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Fonds en séquestre</span>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
          <span className="text-xs tracking-widest uppercase">Défiler</span>
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </motion.div>
    </section>
  );
}
