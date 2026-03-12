import React from "react";
import { Shield, Package, CheckCircle, Banknote } from "lucide-react";

const steps = [
  {
    icon: Shield,
    step: "01",
    title: "Sélection Experte",
    description:
      "Chaque pièce est soigneusement évaluée par nos experts avant d'être mise en vente sur notre plateforme.",
  },
  {
    icon: Banknote,
    step: "02",
    title: "Paiement Sécurisé",
    description:
      "Votre paiement est retenu en séquestre sécurisé par Stripe. Les fonds ne sont jamais versés avant votre confirmation.",
  },
  {
    icon: Package,
    step: "03",
    title: "Livraison Assurée",
    description:
      "L'objet vous est expédié avec un emballage professionnel. Chaque envoi est tracé et assuré pour sa pleine valeur.",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Confirmation & Règlement",
    description:
      "Une fois que vous avez vérifié et confirmé la réception, nous libérons les fonds au vendeur. Simple et transparent.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="gold-divider" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium">
              Processus
            </span>
            <div className="gold-divider" />
          </div>
          <h2 className="font-serif text-4xl font-semibold tracking-tight">
            Comment ça Fonctionne
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Un processus d&apos;achat entièrement sécurisé, de la découverte à
            la livraison
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute top-6 left-[calc(100%-8px)] hidden h-px w-[calc(100%-16px)] border-t border-dashed border-border lg:block" />
              )}

              <div className="flex flex-col items-start">
                {/* Icon & step number */}
                <div className="relative mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 border border-border">
                    <step.icon className="h-5 w-5 text-gold-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white text-xs font-bold">
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-serif font-semibold text-base mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
