"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overblik", match: /^\/$/ },
  { href: "/polls", label: "Meningsmålinger", match: /^\/polls/ },
  { href: "/scenarier", label: "Scenarier", match: /^\/scenarier/ },
  { href: "/kommuner/koebenhavn", label: "Kommuner", match: /^\/kommuner/ },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white/90 px-5 py-8 lg:block">
      <div className="mb-8 space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Kommunalvalg 2025
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Hvem vinder?</h1>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const active = link.match.test(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
              {active && (
                <span className="text-xs uppercase tracking-wide">Live</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

