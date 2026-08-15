"use client";

import { useState } from "react";
import { FormField } from "@/components/ui";

const DEFAULT_COLOR = "#e8590c";

/** Brand colour with an explicit "no colour" escape hatch.
 *
 * An <input type="color"> can never submit an empty value — it falls back to
 * black — so there'd otherwise be no way to unset a colour once chosen. Ticking
 * the box disables the input, which excludes it from the submitted FormData;
 * `str()` then yields undefined and saveShopBranding stores null. That's the
 * existing action contract, so no backend change is needed. */
export function BrandColorField({ defaultColor }: { defaultColor: string | null }) {
  const [none, setNone] = useState(defaultColor === null);
  const [color, setColor] = useState(defaultColor ?? DEFAULT_COLOR);

  return (
    <FormField
      htmlFor="brandColor"
      label="Brand colour"
      hint="Optional accent used on your storefront. Leave it off to use the marketplace default."
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="brandColor"
          name="brandColor"
          type="color"
          value={color}
          disabled={none}
          onChange={(e) => setColor(e.target.value)}
          className="h-11 w-16 cursor-pointer rounded-xl border border-line bg-paper p-1 disabled:cursor-not-allowed disabled:opacity-40"
        />
        <span className={`font-mono text-[12.5px] ${none ? "text-faint line-through" : "text-sub"}`}>{color}</span>

        <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-sub">
          <input
            type="checkbox"
            checked={none}
            onChange={(e) => setNone(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
          />
          Use no brand colour
        </label>
      </div>
    </FormField>
  );
}
