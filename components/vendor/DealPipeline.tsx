import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import type { DealPipelineStage } from "@/lib/vendorDashboard";

function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

const PIPE_BAR = ["bg-pipe-1", "bg-pipe-2", "bg-pipe-3", "bg-pipe-4", "bg-pipe-5", "bg-pipe-6"];

/** The transactional differentiator: how far demand has moved toward money,
 * not just how many leads arrived. Stage cards stay neutral — progress reads
 * through a thin accent bar that deepens toward green, not a solid color fill. */
export function DealPipeline({ stages }: { stages: DealPipelineStage[] }) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <h2 className="text-[13.5px] font-extrabold text-ink">Deal pipeline</h2>
      <p className="mt-0.5 text-[11.5px] font-semibold text-sub">How far demand has moved toward money</p>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {stages.map((stage, i) => {
          const isDelivered = stage.key === "delivered";
          return (
            <Link key={stage.key} href={stage.href} className="group flex flex-col">
              <div className="relative rounded-t-xl border border-b-0 border-line bg-paper p-3 transition-colors group-hover:bg-wash">
                <div className="text-[11px] font-bold text-sub">{stage.label}</div>
                <div className="mt-1.5 font-mono text-[17px] font-extrabold text-ink">{stage.count}</div>
                {stage.value > 0 && (
                  <div className={`mt-0.5 font-mono text-[10.5px] font-bold ${isDelivered || i >= 2 ? "text-green" : "text-sub"}`}>
                    {formatINR(stage.value)}
                  </div>
                )}
                {isDelivered && (
                  <Icon name="check" size={14} strokeWidth={2.4} className="absolute top-2.5 right-2.5 text-green" />
                )}
              </div>
              <div className={`h-[3px] rounded-b-[3px] ${PIPE_BAR[i] ?? "bg-pipe-6"}`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
