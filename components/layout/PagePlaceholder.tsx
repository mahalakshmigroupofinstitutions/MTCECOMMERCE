import { Icon, type IconName } from "@/components/icons/Icon";

export function PagePlaceholder({
  icon,
  title,
  phase,
}: {
  icon: IconName;
  title: string;
  phase: string;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-wash text-ink">
        <Icon name={icon} size={24} />
      </div>
      <h1 className="text-xl font-extrabold text-ink">{title}</h1>
      <p className="text-sm text-sub">{phase}</p>
    </div>
  );
}
