"use client";

import { useEffect, useState } from "react";
import { isValidGstin, normalizeGstin } from "@/lib/gstin";
import { isPlausiblePhoneNumber } from "@/lib/phone";
import type { LocationOption } from "@/lib/location";

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";
const selectClass = inputClass;
const labelClass = "mb-1.5 text-[12px] font-bold text-ink";
const errorTextClass = "mt-1 text-[11.5px] font-semibold text-red-600";

export interface AddressFieldsInitial {
  countryName?: string | null;
  countryIso?: string | null;
  stateName?: string | null;
  stateIso?: string | null;
  city?: string | null;
  pincode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  gstNumber?: string | null;
  phoneCountryCode?: string | null;
}

export interface AddressFieldsProps {
  countries: LocationOption[];
  /** Registration captures the phone number here; Account details keeps the
   * existing read-only phone display and never renders phone inputs from
   * this component — phone editing isn't permitted there today. */
  includePhone?: boolean;
  phoneCountryCodes?: { dialCode: string; label: string }[];
  initial?: AddressFieldsInitial;
}

/** Shared Country → State → City + pincode + GSTIN (+ optional phone)
 * fields, used by both the registration form and account details so the
 * cascading/validation behavior is defined exactly once. Renders plain named
 * inputs/selects meant to sit inside the caller's own <form action={...}> —
 * it never submits anything itself. */
export function AddressFields({ countries, includePhone = false, phoneCountryCodes = [], initial }: AddressFieldsProps) {
  const [countryIso, setCountryIso] = useState(initial?.countryIso || "IN");
  const [states, setStates] = useState<LocationOption[]>([]);
  const [stateIso, setStateIso] = useState(initial?.stateIso || "");
  const [stateTouched, setStateTouched] = useState(false);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [city, setCity] = useState(initial?.city || "");
  const [cityTouched, setCityTouched] = useState(false);
  const [pincode, setPincode] = useState(initial?.pincode || "");
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [gstin, setGstin] = useState(initial?.gstNumber || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(initial?.phoneCountryCode || "+91");
  const [phoneLocal, setPhoneLocal] = useState("");

  const selectedCountry = countries.find((c) => c.isoCode === countryIso);
  const selectedState = states.find((s) => s.isoCode === stateIso);

  // Load states whenever the country changes (including on mount). Country
  // is never unselected (the dropdown has no blank option), so this always
  // has something to fetch — any reset to an empty list happens synchronously
  // in the change handlers below, not here.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/location/states?country=${encodeURIComponent(countryIso)}`)
      .then((r) => r.json())
      .then((data: LocationOption[]) => {
        if (!cancelled) setStates(data);
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso]);

  // Load cities whenever the state changes (including once states finish
  // loading on mount, if an initial state was already selected). No state
  // selected yet means nothing to fetch — `cities` is already [] by default,
  // and handleCountryChange/handleStateChange clear it synchronously on
  // their own when a previous selection is cleared.
  useEffect(() => {
    if (!stateIso) return;
    let cancelled = false;
    fetch(`/api/location/cities?country=${encodeURIComponent(countryIso)}&state=${encodeURIComponent(stateIso)}`)
      .then((r) => r.json())
      .then((data: LocationOption[]) => {
        if (cancelled) return;
        // A previously-saved city (from when this field was free text) might
        // not be in this dataset — keep it selectable rather than silently
        // dropping the stored value.
        if (city && !data.some((c) => c.name === city)) {
          setCities([{ isoCode: city, name: city }, ...data]);
        } else {
          setCities(data);
        }
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIso, stateIso]);

  function handleCountryChange(nextIso: string) {
    setCountryIso(nextIso);
    setStates([]);
    setStateIso("");
    setCities([]);
    setCity("");
    setStateTouched(false);
    setCityTouched(false);
  }

  function handleStateChange(nextIso: string) {
    setStateIso(nextIso);
    setCities([]);
    setCity("");
    setStateTouched(true);
    setCityTouched(false);
  }

  function handleCityChange(nextCity: string) {
    setCity(nextCity);
    setCityTouched(true);
  }

  // India-only best-effort auto-fill. Never the only way to set State/City —
  // both dropdowns stay fully manual regardless of this outcome, and it never
  // overwrites a value the user already picked themselves.
  async function handlePincodeBlur() {
    if (countryIso !== "IN" || !/^[1-9]\d{5}$/.test(pincode)) {
      setPincodeStatus("idle");
      return;
    }
    setPincodeStatus("loading");
    try {
      const res = await fetch(`/api/location/pincode?pincode=${encodeURIComponent(pincode)}`);
      const data: { found: boolean; state?: string; city?: string } = await res.json();
      if (!data.found) {
        setPincodeStatus("notfound");
        return;
      }
      setPincodeStatus("found");

      if (!stateTouched && data.state) {
        const match = states.find((s) => s.name.toLowerCase() === data.state!.toLowerCase());
        if (match) {
          setStateIso(match.isoCode);
          if (!cityTouched && data.city) {
            try {
              const cityRes = await fetch(
                `/api/location/cities?country=${encodeURIComponent(countryIso)}&state=${encodeURIComponent(match.isoCode)}`,
              );
              const cityData: LocationOption[] = await cityRes.json();
              setCities(cityData);
              const cityMatch = cityData.find((c) => c.name.toLowerCase() === data.city!.toLowerCase());
              if (cityMatch) setCity(cityMatch.name);
            } catch {
              // Cities fetch failed — State is still filled in; City stays manual.
            }
          }
        }
      }
    } catch {
      setPincodeStatus("notfound");
    }
  }

  const gstinNormalized = normalizeGstin(gstin);
  const gstinError =
    countryIso === "IN" && gstinNormalized && !isValidGstin(gstinNormalized) ? "That doesn't look like a valid GSTIN." : null;

  const phoneError =
    includePhone && phoneLocal && !isPlausiblePhoneNumber(phoneCountryCode, phoneLocal)
      ? "That doesn't look like a valid phone number for this country code."
      : null;

  return (
    <>
      {includePhone && (
        <div className="flex gap-3">
          <div className="w-[38%]">
            <div className={labelClass}>Phone country</div>
            <select
              name="phoneCountryCode"
              value={phoneCountryCode}
              onChange={(e) => setPhoneCountryCode(e.target.value)}
              className={selectClass}
            >
              {phoneCountryCodes.map((c) => (
                <option key={c.dialCode} value={c.dialCode}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <div className={labelClass}>Mobile number</div>
            <input
              name="phone"
              required
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value)}
              className={inputClass}
            />
            {phoneError && <p className={errorTextClass}>{phoneError}</p>}
          </div>
        </div>
      )}

      <div>
        <div className={labelClass}>Country</div>
        <select
          value={countryIso}
          onChange={(e) => handleCountryChange(e.target.value)}
          className={selectClass}
        >
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.name}
            </option>
          ))}
        </select>
        <input type="hidden" name="country" value={selectedCountry?.name || ""} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className={labelClass}>State</div>
          <select
            value={stateIso}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={states.length === 0}
            className={selectClass}
          >
            <option value="" disabled>
              {states.length === 0 ? "Loading…" : "Select"}
            </option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
          <input type="hidden" name="state" value={selectedState?.name || ""} />
        </div>
        <div>
          <div className={labelClass}>City</div>
          <select
            name="city"
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={!stateIso}
            className={selectClass}
          >
            <option value="" disabled>
              {stateIso ? "Select" : "Select a state first"}
            </option>
            {cities.map((c) => (
              <option key={c.isoCode} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className={labelClass}>Pincode / postal code</div>
          <input
            name="pincode"
            placeholder="600001"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            onBlur={handlePincodeBlur}
            className={inputClass}
          />
          {pincodeStatus === "loading" && <p className="mt-1 text-[11.5px] text-faint">Looking up…</p>}
          {pincodeStatus === "notfound" && (
            <p className="mt-1 text-[11.5px] text-faint">Couldn&rsquo;t auto-fill — please select State/City manually.</p>
          )}
        </div>
        <div>
          <div className={labelClass}>GSTIN (optional)</div>
          <input
            name="gstNumber"
            placeholder="22AAAAA0000A1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            maxLength={15}
            className={inputClass}
          />
          {gstinError && <p className={errorTextClass}>{gstinError}</p>}
        </div>
      </div>

      <div>
        <div className={labelClass}>Address line 1</div>
        <input name="addressLine1" defaultValue={initial?.addressLine1 || ""} placeholder="Street, building" className={inputClass} />
      </div>
      <div>
        <div className={labelClass}>Address line 2 (optional)</div>
        <input
          name="addressLine2"
          defaultValue={initial?.addressLine2 || ""}
          placeholder="Area, landmark"
          className={inputClass}
        />
      </div>
    </>
  );
}
