import { Icon } from "@/components/icons/Icon";
import type { OrderWithSteps } from "@/lib/orders";

export function OrderTimeline({ steps }: { steps: OrderWithSteps["steps"] }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                step.done ? "bg-ink text-white" : step.active ? "border-2 border-ink text-ink" : "border border-line text-faint"
              }`}
            >
              {step.done ? <Icon name="check" size={14} strokeWidth={2.6} /> : <span className="text-[11px] font-bold">{i + 1}</span>}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-px flex-1 ${step.done ? "bg-ink" : "bg-line"}`} style={{ minHeight: 28 }} />
            )}
          </div>
          <div className={`pb-7 ${i === steps.length - 1 ? "pb-0" : ""}`}>
            <div className={`text-[13.5px] font-extrabold ${step.done || step.active ? "text-ink" : "text-faint"}`}>
              {step.label}
            </div>
            <div className="mt-0.5 text-[12px] text-sub">
              {step.at
                ? step.at.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
                : step.active
                  ? "In progress"
                  : "Pending"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
