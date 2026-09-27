export function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5">
      {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-pistachio-deep">{eyebrow}</p>}
      <h2 className="font-display text-3xl font-semibold leading-tight text-brand-espresso sm:text-4xl">{title}</h2>
      {children && <p className="mt-2 max-w-2xl text-brand-muted">{children}</p>}
    </div>
  );
}
