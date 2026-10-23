import { Icon, type IconName } from "@/components/brand";

/** Placeholder for app sections that are scheduled in a later sub-stage. */
export function ComingSoon({ icon, stage, items }: { icon: IconName; stage: string; items: string[] }) {
  return (
    <div className="flex max-w-xl flex-col gap-3 rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 p-[18px]">
      <span className="flex items-center gap-2.5 font-display text-lg font-bold">
        <Icon name={icon} size={24} className="text-brand-wine" />
        Segera hadir
      </span>
      <p className="text-[15px] text-brand-muted">Bagian ini sedang dibangun ({stage}). Nanti isinya:</p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px]">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
