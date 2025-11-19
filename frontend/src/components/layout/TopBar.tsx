"use client";

import Link from "next/link";
import { useMemo } from "react";
import { runtimeConfig } from "@/lib/config";

const quickFilters = [
  { label: "Nationalt", href: "/" },
  { label: "Kommuner", href: "/kommuner/koebenhavn" },
  { label: "Polls", href: "/polls" },
  { label: "Scenarier", href: "/scenarier" },
];

export function TopBar() {
  const buildTime = useMemo(() => new Date().toLocaleString("da-DK"), []);

  return (
    <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Opdateret {buildTime}
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">
          Dashboard for kommunalvalg 2025
        </h2>
        <p className="text-sm text-slate-500">
          Data fra api.hvemvindervalget.dk ·{" "}
          {runtimeConfig.useStubData ? "Stubs aktiv" : "Live data"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Link
            key={filter.label}
            href={filter.href}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400"
          >
            {filter.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

