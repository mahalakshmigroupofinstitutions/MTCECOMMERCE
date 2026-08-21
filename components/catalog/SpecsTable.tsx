type SpecPair = [string, string];

function asSpecPairs(value: unknown): SpecPair[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (row): row is SpecPair => Array.isArray(row) && row.length === 2 && typeof row[0] === "string" && typeof row[1] === "string"
  );
}

export function SpecsTable({ specs }: { specs: unknown }) {
  const rows = asSpecPairs(specs);
  if (!rows.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      {rows.map(([key, value], i) => (
        <div
          key={key}
          className={`flex justify-between gap-4 px-4 py-3 ${i % 2 ? "bg-wash" : "bg-paper"} ${i < rows.length - 1 ? "border-b border-line" : ""}`}
        >
          <span className="text-[13px] text-sub">{key}</span>
          <span className="text-right text-[13px] font-bold text-ink">{value}</span>
        </div>
      ))}
    </div>
  );
}
