import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { VerifiedBadge } from "@/components/ui";

export interface ProfileSummaryCardProps {
  name: string;
  city: string;
  verified: boolean;
  completionPercent: number;
  completeHref: string;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function ProfileSummaryCard({ name, city, verified, completionPercent, completeHref }: ProfileSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-line bg-wash">
          <span className="font-mono text-[15px] font-extrabold text-ink">{initials(name)}</span>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-ink">{name}</h1>
            <VerifiedBadge show={verified} small />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-sub">
            <Icon name="pin" size={13} />
            {city}
          </div>
        </div>
      </div>

      {completionPercent < 100 && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-bold text-ink">Profile completion</span>
            <span className="font-mono text-[13px] font-extrabold text-ink">{completionPercent}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-wash">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <Link
            href={completeHref}
            className="mt-2 inline-block text-[12.5px] font-bold text-ink underline transition-colors hover:text-accent"
          >
            Complete missing information →
          </Link>
        </div>
      )}
    </div>
  );
}
