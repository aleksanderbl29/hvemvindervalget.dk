"use client";

import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";

interface HeaderButtonProps {
  href: string;
  label: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

const defaultActiveClassName =
  "bg-slate-900 text-white hover:bg-slate-800";
const defaultInactiveClassName =
  "border border-slate-200 bg-white text-slate-800 hover:border-slate-400";

export function HeaderButton({
  href,
  label,
  activeClassName = defaultActiveClassName,
  inactiveClassName = defaultInactiveClassName,
}: HeaderButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname?.startsWith(href);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const supportsViewTransitions =
      typeof document !== "undefined" &&
      "startViewTransition" in document;

    // Basic logging so we can see how often and from where nav clicks happen.
    // This helps validate that the nav-based view transitions are wired correctly.
    // eslint-disable-next-line no-console
    console.log("[HeaderButton] navigate", {
      from: pathname,
      to: href,
      supportsViewTransitions,
    });

    if (pathname === href) return;

    // Use the View Transitions API when available for smoother nav changes.
    if (supportsViewTransitions) {
      event.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).startViewTransition(() => {
        router.push(href);
      });
    }
  };

  return (
    <PrefetchLink
      href={href}
      onClick={handleClick}
      className={`header-nav-button rounded-full px-4 py-2 text-sm font-medium ${
        isActive
          ? `header-nav-button--active ${activeClassName}`
          : inactiveClassName
      }`}
    >
      {label}
    </PrefetchLink>
  );
}
