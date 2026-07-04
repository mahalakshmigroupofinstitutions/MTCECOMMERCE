type TierPair = [string, string];

function asTierPairs(value: unknown): TierPair[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (row): row is TierPair => Array.isArray(row) && row.length === 2 && typeof row[0] === "string" && typeof row[1] === "string"
  );
}

export function PriceTiers({ tiers }: { tiers: unknown }) {
  const rows = asTierPairs(tiers);
  if (!rows.length) return null;

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="mb-2.5 text-[11px] font-extrabold tracking-wide text-ink">BULK PRICE TIERS</div>
      {rows.map(([range, price], i) => (
        <div key={range} className={`flex justify-between py-1.5 ${i < rows.length - 1 ? "border-b border-dashed border-line" : ""}`}>
          <span className="text-[12.5px] text-sub">{range}</span>
          <span className="font-mono text-[13px] font-extrabold text-ink">{price}</span>
        </div>
      ))}
    </div>
  );
}
