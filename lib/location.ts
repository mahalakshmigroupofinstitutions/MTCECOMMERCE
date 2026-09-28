/* Shared Country → State → City data source for buyer registration and
 * account details (one dataset, not duplicated per page). Backed by the
 * `country-state-city` package — a static, offline dataset, so cascading
 * selection never depends on a third-party API being up. Server-only: the
 * package's full JSON dataset must never end up in a client bundle, so
 * consumers reach it through app/api/location/* route handlers, never a
 * direct client-side import. */
import "server-only";
import { Country, State, City } from "country-state-city";

export interface LocationOption {
  isoCode: string;
  name: string;
}

/** All countries, for the top-level dropdown. India first (this app's
 * primary market), then the rest alphabetically. */
export function getAllCountries(): LocationOption[] {
  const all = Country.getAllCountries();
  const [india, rest] = [all.filter((c) => c.isoCode === "IN"), all.filter((c) => c.isoCode !== "IN")];
  rest.sort((a, b) => a.name.localeCompare(b.name));
  return [...india, ...rest].map((c) => ({ isoCode: c.isoCode, name: c.name }));
}

export function getStatesForCountry(countryIso: string): LocationOption[] {
  return State.getStatesOfCountry(countryIso)
    .map((s) => ({ isoCode: s.isoCode, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCitiesForState(countryIso: string, stateIso: string): LocationOption[] {
  return City.getCitiesOfState(countryIso, stateIso)
    .map((c) => ({ isoCode: c.name, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The dial-code dropdown reuses the same country dataset (its `phonecode`
 * field) rather than carrying a second list — India first, deduplicated by
 * dial code since several countries can share one (e.g. NANP's +1). */
export function getPhoneCountryCodes(): { dialCode: string; label: string }[] {
  const seen = new Set<string>();
  const result: { dialCode: string; label: string }[] = [];
  for (const c of getAllCountries()) {
    const raw = Country.getCountryByCode(c.isoCode)?.phonecode;
    if (!raw) continue;
    const dialCode = `+${raw.replace(/\D/g, "")}`;
    if (seen.has(dialCode)) continue;
    seen.add(dialCode);
    result.push({ dialCode, label: `${dialCode} (${c.name})` });
  }
  return result;
}

/** Resolves a stored country *name* (Buyer.country) back to its ISO code, so
 * an edit form can pre-select the right dropdown option and know which
 * states to load. Buyer rows store the name, not the code — see the schema
 * comment on Buyer.country. Returns null for a legacy/unset value. */
export function findCountryIsoByName(name: string | null | undefined): string | null {
  if (!name) return null;
  return Country.getAllCountries().find((c) => c.name === name)?.isoCode ?? null;
}

/** Same resolution for a stored state name, scoped to the already-resolved
 * country ISO code (state names aren't unique across countries). */
export function findStateIsoByName(countryIso: string | null, name: string | null | undefined): string | null {
  if (!countryIso || !name) return null;
  return State.getStatesOfCountry(countryIso).find((s) => s.name === name)?.isoCode ?? null;
}
