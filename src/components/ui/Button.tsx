import type { ReactNode } from "react";
import { clsx } from "clsx";
import { ExternalLink } from "./ExternalLink";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "min-h-11 items-center justify-center gap-2 rounded-chip border px-4 text-small font-medium transition-colors duration-150 ease-out";

const variants: Record<Variant, string> = {
  primary: "border-signal/60 bg-signal/10 text-text hover:border-signal hover:bg-signal/15",
  secondary: "border-line-strong bg-bg-raised text-text hover:border-signal",
  ghost: "border-transparent text-muted hover:text-text",
};

type Props = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  external?: boolean;
  download?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "secondary",
  external,
  download,
  className,
  ...rest
}: Props) {
  const cls = clsx("inline-flex", base, variants[variant], className);
  if (external) {
    return (
      <ExternalLink href={href} className={cls} {...rest}>
        {children}
      </ExternalLink>
    );
  }
  return (
    <a href={href} className={cls} download={download || undefined} {...rest}>
      {children}
    </a>
  );
}

/** `display` is its own slot so callers can hide the button without class conflicts. */
export const buttonClasses = (variant: Variant = "secondary", display = "inline-flex") =>
  clsx(display, base, variants[variant]);
