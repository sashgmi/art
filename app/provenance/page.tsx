export const metadata = {
  title: "Provenance & Garanties",
  description: "Notre engagement sur l'authenticité, la provenance et les garanties offertes à nos acheteurs.",
};

const sections = [
  {
    title: "Vérification de la provenance",
    body: "Chaque objet proposé sur Galerie Antiquités fait l'objet d'une vérification rigoureuse de sa provenance. Nos experts examinent l'historique de propriété, les archives disponibles et les certificats d'authenticité avant toute mise en ligne.",
  },
  {
    title: "Expertise indépendante",
    body: "Nous collaborons avec un réseau d'experts indépendants spécialisés par domaine — mobilier, tableaux, sculptures, céramiques — qui valident l'attribution, la datation et l'état de conservation de chaque pièce.",
  },
  {
    title: "Paiement sécurisé en séquestre",
    body: "Les fonds de l'acheteur sont conservés en séquestre sur notre plateforme jusqu'à confirmation de réception. Le vendeur ne perçoit le règlement qu'une fois l'acheteur pleinement satisfait. En cas de litige, notre équipe intervient pour trouver une résolution équitable.",
  },
  {
    title: "Droit de retour",
    body: "Si un objet ne correspond pas à sa description ou présente un défaut non signalé, l'acheteur bénéficie d'un délai de 14 jours pour initier un retour. Les frais de retour sont pris en charge par le vendeur dans ce cas.",
  },
  {
    title: "Conformité légale",
    body: "Galerie Antiquités s'assure que les biens culturels proposés respectent la législation française et européenne, notamment le règlement UE 2019/880 relatif à l'introduction et à l'importation de biens culturels.",
  },
];

export default function ProvenancePage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto max-w-3xl px-4 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Notre engagement
          </p>
          <h1 className="font-serif text-4xl font-medium text-foreground mb-4">
            Provenance & Garanties
          </h1>
          <div className="gold-divider mx-auto mb-6" />
          <p className="text-muted-foreground leading-relaxed">
            L&apos;authenticité est au cœur de notre démarche. Voici comment nous protégeons acheteurs et vendeurs à chaque étape.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <div key={i} className="border-l-2 border-gold-300 pl-6">
              <h2 className="font-serif text-xl font-medium text-foreground mb-3">
                {section.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center border border-border rounded-sm p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Une question ?
          </p>
          <h3 className="font-serif text-2xl font-medium text-foreground mb-4">
            Contactez nos experts
          </h3>
          <a
            href="mailto:experts@galerie-antiquites.fr"
            className="text-gold-600 hover:text-gold-700 text-sm tracking-wide transition-colors"
          >
            experts@galerie-antiquites.fr
          </a>
        </div>
      </div>
    </div>
  );
}
