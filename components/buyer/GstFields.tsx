"use client";

import { useState } from "react";
import { isValidGstin, normalizeGstin } from "@/lib/gstin";

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";
const labelClass = "mb-1.5 text-[12px] font-bold text-ink";
const errorTextClass = "mt-1 text-[11.5px] font-semibold text-red-600";

export interface GstFieldsProps {
  /** ISO code of the currently selected country — the GSTIN checksum hint
   * only applies to India, matching the server-side rule. */
  countryIso: string;
  /** Effective value (see effectiveGstRegistered); null/false start at "No". */
  initialRegistered?: boolean | null;
  initialGstNumber?: string | null;
}

/** GST Registered Yes/No + a GSTIN input that only exists while "Yes" is
 * selected — so choosing "No" submits no GSTIN at all, and the server
 * (resolveGst in lib/buyerProfile.ts) clears any stored one. Shared by
 * registration (via AddressFields) and the account page's Business Profile. */
export function GstFields({ countryIso, initialRegistered, initialGstNumber }: GstFieldsProps) {
  const [registered, setRegistered] = useState<"yes" | "no">(initialRegistered ? "yes" : "no");
  const [gstin, setGstin] = useState(initialGstNumber || "");

  const gstinNormalized = normalizeGstin(gstin);
  const gstinError =
    countryIso === "IN" && gstinNormalized && !isValidGstin(gstinNormalized) ? "That doesn't look like a valid GSTIN." : null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <div className={labelClass}>GST registered</div>
        <select
          name="gstRegistered"
          value={registered}
          onChange={(e) => setRegistered(e.target.value === "yes" ? "yes" : "no")}
          className={inputClass}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      {registered === "yes" && (
        <div>
          <div className={labelClass}>GSTIN</div>
          <input
            name="gstNumber"
            required
            placeholder="22AAAAA0000A1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            maxLength={15}
            className={inputClass}
          />
          {gstinError && <p className={errorTextClass}>{gstinError}</p>}
        </div>
      )}
    </div>
  );
}
