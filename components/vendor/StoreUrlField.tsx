"use client";

import { useState } from "react";
import { FormField, inputClassName } from "@/components/ui";
import { slugify } from "@/lib/slug";
import { STORE_URL_HOST } from "./shopSetupMeta";

/** The storefront URL is Supplier.slug — the same slug /supplier/[slug] already
 * serves. There is deliberately no Shop.slug, so this field edits the vendor's
 * one canonical address. Shows the resulting public URL as it's typed, since
 * what gets stored is the slugified value, not the raw input. */
export function StoreUrlField({ defaultSlug }: { defaultSlug: string }) {
  const [value, setValue] = useState(defaultSlug);
  const preview = slugify(value);
  const tooShort = preview.length < 3;

  return (
    <FormField
      htmlFor="storeSlug"
      label="Store URL"
      hint="Lowercase letters, numbers and hyphens. Changing this changes your public storefront address."
    >
      <div className={`flex items-center gap-0 overflow-hidden ${inputClassName} p-0 focus-within:border-ink`}>
        <span className="shrink-0 py-3 pl-3.5 font-mono text-[12.5px] text-faint">{STORE_URL_HOST}/supplier/</span>
        <input
          id="storeSlug"
          name="storeSlug"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={80}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 py-3 pr-3.5 font-mono text-[12.5px] text-ink outline-none"
        />
      </div>

      <p className="mt-1 text-[11.5px] text-faint">
        {tooShort ? (
          <span className="text-accent">Store URLs need at least 3 letters or numbers.</span>
        ) : (
          <>
            Your storefront will be at{" "}
            <span className="font-mono text-sub">
              {STORE_URL_HOST}/supplier/{preview}
            </span>
          </>
        )}
      </p>
    </FormField>
  );
}
