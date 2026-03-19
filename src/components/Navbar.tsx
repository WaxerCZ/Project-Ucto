"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const role = (session.user as { role?: string })?.role;
  const isTeacher = role === "TEACHER";
  const isAdmin = role === "ADMIN";

  const navLinks = [
    { href: "/dashboard", label: "Přehled", icon: "⊞" },
    { href: "/workspaces", label: "Prostory", icon: "☰" },
    { href: "/exercises", label: "Cvičení", icon: "✎" },
    { href: "/submissions", label: "Odevzdání", icon: "✓" },
    ...(isTeacher ? [{ href: "/classes", label: "Třídy", icon: "👥" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "⚙" }] : []),
  ];

  const roleBadge = {
    ADMIN: { label: "Admin", className: "bg-red-100 text-red-700" },
    TEACHER: { label: "Učitel", className: "bg-purple-100 text-purple-700" },
    STUDENT: { label: "Student", className: "bg-blue-100 text-blue-700" },
  }[role || "STUDENT"];

  return (
    <nav className="h-14 bg-white border-b border-border flex-shrink-0">
      <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/dashboard"
            className="text-lg font-bold text-accent tracking-tight mr-4 sm:mr-6 whitespace-nowrap"
          >
            Účetní Praxe
          </Link>
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-light text-accent"
                    : "text-muted hover:text-foreground hover:bg-gray-100"
                }`}
              >
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sm:hidden">{link.icon}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-muted">{session.user?.email}</span>
            {roleBadge && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${roleBadge.className}`}>
                {roleBadge.label}
              </span>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-muted hover:text-danger transition-colors"
          >
            Odhlásit
          </button>
        </div>
      </div>
    </nav>
  );
}
