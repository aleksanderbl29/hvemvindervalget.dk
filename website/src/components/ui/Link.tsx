"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import type { UrlObject } from "url";

type LinkProps = ComponentProps<typeof NextLink>;

function hrefToString(href: string | UrlObject): string {
  if (typeof href === "string") return href;
  const { pathname = "", search = "", hash = "" } = href;
  return `${pathname}${search}${hash}`;
}

export function Link({
  href,
  onMouseEnter,
  ...props
}: LinkProps) {
  const router = useRouter();

  const handleMouseEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    router.prefetch(hrefToString(href));
    if (typeof onMouseEnter === "function") {
      onMouseEnter(e);
    }
  };

  return (
    <NextLink href={href} prefetch={false} onMouseEnter={handleMouseEnter} {...props} />
  );
}
