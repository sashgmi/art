import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Gem, LayoutDashboard, Package, ShoppingBag, Users, BarChart3 } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/connexion?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const navItems = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/annonces", label: "Modération annonces", icon: Package },
    { href: "/admin/commandes", label: "Commandes & Séquestre", icon: ShoppingBag },
    { href: "/admin/vendeurs", label: "Vendeurs", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-foreground text-white">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <Gem className="h-4 w-4 text-gold-400" />
          <span className="font-serif text-sm font-semibold tracking-wide">
            Administration
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/40">
            <p className="font-medium text-white/70">{session.user.name}</p>
            <p>Administrateur</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-foreground text-white">
          <Gem className="h-4 w-4 text-gold-400" />
          <span className="font-serif text-sm font-semibold">Administration</span>
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
