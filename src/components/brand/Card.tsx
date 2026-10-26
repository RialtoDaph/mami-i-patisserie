import type { ComponentProps } from "react";

/** Website card: postcard style, no radius, soft paper shadow. `lift` adds the hover raise (-6px). */
export function PostCard({ lift, className, ...rest }: { lift?: boolean } & ComponentProps<"article">) {
  return (
    <article
      className={`bg-white shadow-postcard ${lift ? "transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-postcard-hover" : ""} ${className ?? ""}`}
      {...rest}
    />
  );
}

/** Internal app card: butter-50, 1.5px line, radius 6px, padding 18px. */
export function AppCard({ title, action, className, children, ...rest }: { title?: React.ReactNode; action?: React.ReactNode } & ComponentProps<"section">) {
  return (
    <section className={`rounded-md border-[1.5px] border-line bg-brand-butter-50 p-[18px] ${className ?? ""}`} {...rest}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
