"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderButton } from "@/components/ui/HeaderButton";

const previousElections = [{ label: "Kommunalvalg 2025", href: "/kv25" }];

const defaultActiveClassName =
  "bg-slate-900 text-white hover:bg-slate-800";
const defaultInactiveClassName =
  "border border-slate-200 bg-white text-slate-800 hover:border-slate-400";

export function SiteHeader() {
  const pathname = usePathname();
  const isPreviousElectionActive = previousElections.some(
    (election) => pathname?.startsWith(election.href)
  );

  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-3 rounded-lg px-2 py-1 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
          aria-label="Gå til forsiden"
        >
          <svg
            className="h-10 w-10 shrink-0 rounded-md border border-slate-200"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <rect width="32" height="32" fill="#ffffff" />
            <rect x="8" y="14" width="16" height="12" rx="1.5" fill="#000000" />
            <rect x="10" y="10" width="12" height="4" rx="1" fill="#000000" />
            <path
              d="M13 19 L15.5 21.5 L19 17"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <rect
              x="11"
              y="21"
              width="10"
              height="3"
              rx="0.5"
              fill="#ffffff"
              opacity="0.3"
            />
            <rect
              x="11"
              y="24.5"
              width="8"
              height="1.5"
              rx="0.5"
              fill="#ffffff"
              opacity="0.3"
            />
          </svg>
          <span>Hvem vinder valget?</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <HeaderButton href="/fv26" label="Folketingsvalg 2026" />
          <HeaderButton href="/polls" label="Meningsmålinger" />

          <details className="relative">
            <summary
              className={`list-none cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                isPreviousElectionActive
                  ? defaultActiveClassName
                  : defaultInactiveClassName
              }`}
            >
              Tidl. valg
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="py-2">
                {previousElections.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </details>

          <HeaderButton href="/om" label="Om" />
        </div>
      </div>
    </header>
  );
}
