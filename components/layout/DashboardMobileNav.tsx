"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, type LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  title: string;
  navItems: NavItem[];
  userName?: string | null;
  userEmail?: string | null;
  userRoleLabel: string;
  variant?: "dark" | "light";
}

export default function DashboardMobileNav({
  title,
  navItems,
  userName,
  userEmail,
  userRoleLabel,
  variant = "light",
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isDark = variant === "dark";

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
        className={cn(
          "ml-auto p-2 rounded-sm transition-colors",
          isDark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
        )}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside
            className={cn(
              "absolute top-0 left-0 h-full w-72 max-w-[85vw] flex flex-col shadow-xl",
              isDark ? "bg-foreground text-white" : "bg-white text-foreground"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between px-5 py-4 border-b",
                isDark ? "border-white/10" : "border-border"
              )}
            >
              <span className="font-serif text-sm font-semibold">{title}</span>
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                className={cn(
                  "p-1.5 rounded-sm transition-colors",
                  isDark ? "hover:bg-white/10" : "hover:bg-muted"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                      isDark
                        ? active
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                        : active
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div
              className={cn(
                "p-4 border-t space-y-3",
                isDark ? "border-white/10" : "border-border"
              )}
            >
              <div className={cn("text-xs", isDark ? "text-white/60" : "text-muted-foreground")}>
                {userName && (
                  <p className={cn("font-medium", isDark ? "text-white/90" : "text-foreground")}>
                    {userName}
                  </p>
                )}
                {userEmail && <p className="truncate">{userEmail}</p>}
                <p className="mt-0.5">{userRoleLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
                  isDark
                    ? "text-white/80 hover:bg-white/10"
                    : "text-destructive hover:bg-destructive/5"
                )}
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
