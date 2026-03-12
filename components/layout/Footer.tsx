import Link from "next/link";
import { Gem } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Gem className="h-5 w-5 text-gold-500" />
              <span className="font-serif text-lg font-semibold">
                Galerie Antiquités
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Une sélection rigoureuse d&apos;objets d&apos;art et
              d&apos;antiquités, présentés par des experts passionnés.
            </p>
            <div className="mt-6">
              <div className="gold-divider" />
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-serif font-semibold mb-4 text-sm tracking-wider uppercase text-muted-foreground">
              Catalogue
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/catalogue", label: "Tous les articles" },
                { href: "/categories", label: "Catégories" },
                { href: "/catalogue?stockLocation=AT_RESIDENCE", label: "À la Résidence" },
                { href: "/catalogue?stockLocation=AT_VENDOR", label: "Chez le Vendeur" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-serif font-semibold mb-4 text-sm tracking-wider uppercase text-muted-foreground">
              Services
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/provenance", label: "Provenance & Authenticité" },
                { href: "/paiement-securise", label: "Paiement Sécurisé" },
                { href: "/livraison", label: "Livraison & Assurance" },
                { href: "/inscription?role=VENDOR", label: "Devenir Vendeur" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-serif font-semibold mb-4 text-sm tracking-wider uppercase text-muted-foreground">
              Informations
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/a-propos", label: "À propos" },
                { href: "/contact", label: "Contact" },
                { href: "/cgv", label: "CGV" },
                { href: "/mentions-legales", label: "Mentions légales" },
                { href: "/confidentialite", label: "Politique de confidentialité" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="section-divider" />
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} Galerie Antiquités. Tous droits
            réservés.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-6" viewBox="0 0 32 24" fill="none">
                <rect width="32" height="24" rx="3" fill="#F3F4F6" />
                <circle cx="13" cy="12" r="5" fill="#EB001B" />
                <circle cx="19" cy="12" r="5" fill="#F79E1B" />
                <path
                  d="M16 8.3a5 5 0 0 1 0 7.4A5 5 0 0 1 16 8.3z"
                  fill="#FF5F00"
                />
              </svg>
              Mastercard
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-8" viewBox="0 0 48 24" fill="none">
                <rect width="48" height="24" rx="3" fill="#F3F4F6" />
                <path d="M20 7h8l-4 10h-8z" fill="#1A1F71" />
                <path d="M12 7h6l3 10H9z" fill="#1A1F71" />
                <path d="M28 7h6l3 10h-6z" fill="#F7A600" />
              </svg>
              Visa
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                  stroke="#6366F1"
                  strokeWidth="2"
                />
                <path d="M2 10h20" stroke="#6366F1" strokeWidth="2" />
              </svg>
              Stripe Sécurisé
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
