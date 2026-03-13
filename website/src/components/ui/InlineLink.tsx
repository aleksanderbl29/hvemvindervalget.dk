import type { ComponentProps } from "react";
import { PrefetchLink } from "@/components/ui/PrefetchLink";

type InlineLinkProps = ComponentProps<typeof PrefetchLink>;

export function InlineLink({ className, ...props }: InlineLinkProps) {
  return (
    <PrefetchLink
      className={`underline underline-offset-2 hover:text-slate-900 transition ${className ?? ""}`.trim()}
      {...props}
    />
  );
}
