import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-bg-raised p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] md:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
