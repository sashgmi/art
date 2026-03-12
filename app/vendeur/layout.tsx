import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Gem, LayoutDashboard, Package, ShoppingBag, CreditCard, Settings } from "lucide-react";

export default async function VendeurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/connexion?callbackUrl=/vendeur");
  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const navItems = [
    { href: "/vendeur", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { href: "/vendeur/annonces", label: "Mes annonces", icon: Package },
    { href: "/vendeur/ventes", label: "Mes ventes", icon: ShoppingBag },
    { href: "/vendeur/annonces/nouvelle", label: "Nouvelle annonce", icon: Package },
    { href: "/vendeur/paiements", label: "Paiements", icon: CreditCard },
    { href: "/vendeur/compte", label: "Mon compte", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-border">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <Gem className="h-4 w-4 text-gold-500" />
          <span className="font-serif text-sm font-semibold">
            Espace Vendeur
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              {session.user.name}
            </p>
            <p>{session.user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <Gem className="h-4 w-4 text-gold-500" />
          <span className="font-serif text-sm font-semibold">Espace Vendeur</span>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
