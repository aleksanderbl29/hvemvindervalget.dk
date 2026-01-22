"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const isActive = pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        isActive ? activeClassName : inactiveClassName
      }`}
    >
      {label}
    </Link>
  );
}
