"use client";

import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { usePathname } from "next/navigation";
import { HeaderButton } from "@/components/ui/HeaderButton";
import { useEffect, useRef, useState } from "react";

const defaultActiveClassName = "bg-slate-900 text-white hover:bg-slate-800";
const defaultInactiveClassName =
  "border border-slate-200 bg-white text-slate-800 hover:border-slate-400";

const navLinks = [
  { href: "/fv26", label: "Folketingsvalg 2026" },
  { href: "/polls", label: "Meningsmålinger" },
];

const omLinks = [
  { href: "/om", label: "Om siden" },
  { href: "/om/metoder", label: "Metoder" },
  { href: "/om/privatliv", label: "Privatliv" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const omDetailsRef = useRef<HTMLDetailsElement | null>(null);
  const [isOmOpen, setIsOmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Lightweight logging to validate that header re-renders track route changes
    // and to confirm when we're relying on the View Transitions API.
    // eslint-disable-next-line no-console
    console.log("[SiteHeader] pathname changed", {
      pathname,
      supportsViewTransitions:
        typeof document !== "undefined" &&
        "startViewTransition" in document,
    });
  }, [pathname]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!omDetailsRef.current) return;
      const target = event.target as Node | null;
      if (omDetailsRef.current.contains(target)) return;
      if (isOmOpen) setIsOmOpen(false);
    }
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [isOmOpen]);

  return (
    <header className="site-header border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <PrefetchLink
          href="/"
          className="inline-flex items-center gap-3 rounded-lg px-2 py-1 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
          aria-label="Gå til forsiden"
        >
          <svg
            className="h-9 w-9 shrink-0 rounded-md border border-slate-200"
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
            <rect x="11" y="21" width="10" height="3" rx="0.5" fill="#ffffff" opacity="0.3" />
            <rect x="11" y="24.5" width="8" height="1.5" rx="0.5" fill="#ffffff" opacity="0.3" />
          </svg>
          <span>Hvem vinder valget?</span>
        </PrefetchLink>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 sm:flex sm:gap-3">
          {navLinks.map((link) => (
            <HeaderButton key={link.href} href={link.href} label={link.label} />
          ))}

          <details ref={omDetailsRef} className="relative" open={isOmOpen}>
            <summary
              className={`list-none cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                pathname?.startsWith("/om") ? defaultActiveClassName : defaultInactiveClassName
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOmOpen((prev) => !prev);
              }}
            >
              Om
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="py-2">
                {omLinks.map((link) => (
                  <PrefetchLink
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setIsOmOpen(false)}
                  >
                    {link.label}
                  </PrefetchLink>
                ))}
              </div>
            </div>
          </details>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="flex items-center justify-center rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 sm:hidden"
          aria-label={isMobileMenuOpen ? "Luk menu" : "Åbn menu"}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 sm:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <PrefetchLink
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  pathname?.startsWith(link.href) ? defaultActiveClassName : "text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </PrefetchLink>
            ))}

            <div className="my-1 border-t border-slate-100" />
            <p className="px-4 pb-1 pt-0.5 text-xs font-medium uppercase tracking-wider text-slate-400">Om</p>

            {omLinks.map((link) => (
              <PrefetchLink
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  pathname === link.href ? defaultActiveClassName : "text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </PrefetchLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
