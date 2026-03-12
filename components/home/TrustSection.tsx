import React from "react";
import { Award, Users, Package, TrendingUp } from "lucide-react";

const stats = [
  { icon: Award, value: "100%", label: "Articles certifiés" },
  { icon: Users, value: "200+", label: "Vendeurs vérifiés" },
  { icon: Package, value: "1 500+", label: "Pièces vendues" },
  { icon: TrendingUp, value: "15 ans", label: "D'expertise" },
];

export default function TrustSection() {
  return (
    <section className="py-24 bg-stone-100">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gold-500" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold-500 font-medium">
              Notre Engagement
            </span>
            <div className="h-px w-12 bg-gold-500" />
          </div>
          <h2 className="font-serif text-4xl font-semibold text-foreground">
            La Confiance au Cœur de Notre Démarche
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Chaque transaction est protégée par notre système de séquestre.
            Achetez l&apos;esprit tranquille.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-stone-200">
                  <stat.icon className="h-6 w-6 text-gold-500" />
                </div>
              </div>
              <div className="font-serif text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
