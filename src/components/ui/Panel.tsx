import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-xl border border-neutral-800 bg-neutral-900/60 p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold tracking-wide text-neutral-300 uppercase">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
