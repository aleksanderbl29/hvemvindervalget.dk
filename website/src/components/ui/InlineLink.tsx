"use client";

import type { ComponentProps } from "react";
import { Link } from "@/components/ui/Link";

type InlineLinkProps = ComponentProps<typeof Link>;

export function InlineLink({ className, ...props }: InlineLinkProps) {
  return (
    <Link
      className={`underline underline-offset-2 hover:text-slate-900 transition ${className ?? ""}`.trim()}
      {...props}
    />
  );
}
