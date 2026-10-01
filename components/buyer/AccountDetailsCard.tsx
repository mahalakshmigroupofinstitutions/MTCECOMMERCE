"use client";

import { useActionState, useState } from "react";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { AddressFields } from "@/components/buyer/AddressFields";
import { GstFields } from "@/components/buyer/GstFields";
import { updateProfile, type UpdateProfileState } from "@/app/(buyer)/account/actions";
import {
  BUYER_TYPE_OPTIONS,
  MIN_YEAR_ESTABLISHED,
  PROCUREMENT_FREQUENCY_OPTIONS,
  buyerTypeLabel,
  procurementFrequencyLabel,
} from "@/lib/buyerProfile";
import type { LocationOption } from "@/lib/location";

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";
const labelClass = "mb-1.5 text-[12px] font-bold text-ink";
const readOnlyValueClass = "rounded-xl border border-line bg-wash px-3.5 py-3 text-sm text-sub";
const sectionTitleClass = "text-[13px] font-extrabold uppercase tracking-wide text-sub";

export interface AccountDetailsBuyer {
  phone: string;
  name: string | null;
  companyName: string | null;
  buyerType: string | null;
  yearEstablished: number | null;
  procurementFrequency: string | null;
  designation: string | null;
  businessEmail: string | null;
  panNumber: string | null;
  /** Effective value — legacy rows with a GSTIN but no flag read as true. */
  gstRegistered: boolean | null;
  gstNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  pincode: string | null;
}

export interface AccountDetailsCardProps {
  buyer: AccountDetailsBuyer;
  countries: LocationOption[];
  countryIso: string;
  stateIso: string | null;
}

/** Toggles the account page's profile between a read-only view and the edit
 * form — same page/route, same server action, no duplicate update logic.
 * Both modes are grouped into Business Profile, Primary Contact and Business
 * Address sections.
 *
 * `editKey` forces EditForm to remount (a fresh useActionState, with no
 * leftover error from a previous attempt) every time Edit is (re-)entered —
 * without it, cancelling out of a failed edit and reopening it would still
 * show the old error message even though nothing had been resubmitted yet. */
export function AccountDetailsCard({ buyer, countries, countryIso, stateIso }: AccountDetailsCardProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editKey, setEditKey] = useState(0);

  if (mode === "view") {
    return (
      <div className="flex flex-col gap-6">
        <Section title="Business Profile">
          <Field label="Company name" value={buyer.companyName} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Buyer type" value={buyerTypeLabel(buyer.buyerType)} />
            <Field label="Year established" value={buyer.yearEstablished?.toString() ?? null} />
            <Field label="Procurement frequency" value={procurementFrequencyLabel(buyer.procurementFrequency)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="GST registered"
              value={buyer.gstRegistered === null ? null : buyer.gstRegistered ? "Yes" : "No"}
            />
            <Field label="GSTIN" value={buyer.gstNumber} mono />
            <Field label="PAN" value={buyer.panNumber} mono />
          </div>
        </Section>

        <Section title="Primary Contact">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact person" value={buyer.name} />
            <Field label="Designation" value={buyer.designation} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Business email" value={buyer.businessEmail} />
            <Field label="Mobile number" value={buyer.phone} mono />
          </div>
        </Section>

        <Section title="Business Address">
          <Field label="Address line 1" value={buyer.addressLine1} />
          <Field label="Address line 2" value={buyer.addressLine2} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Country" value={buyer.country} />
            <Field label="State" value={buyer.state} />
            <Field label="City" value={buyer.city} />
          </div>
          <Field label="Pincode" value={buyer.pincode} />
        </Section>

        <button
          type="button"
          onClick={() => {
            setEditKey((k) => k + 1);
            setMode("edit");
          }}
          className={`${buttonClassName({ size: "sm" })} self-start`}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <EditForm
      key={editKey}
      buyer={buyer}
      countries={countries}
      countryIso={countryIso}
      stateIso={stateIso}
      onCancel={() => setMode("view")}
    />
  );
}

function EditForm({
  buyer,
  countries,
  countryIso,
  stateIso,
  onCancel,
}: AccountDetailsCardProps & { onCancel: () => void }) {
  const [state, formAction] = useActionState<UpdateProfileState, FormData>(updateProfile, {});
  // Lifted out of AddressFields so the GST fields (in Business Profile) know
  // which country the address section currently has selected.
  const [currentCountryIso, setCurrentCountryIso] = useState(countryIso);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <p role="alert" className="rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          {state.error}
        </p>
      )}

      <Section title="Business Profile">
        <div>
          <div className={labelClass}>Company name</div>
          <input name="companyName" required defaultValue={buyer.companyName ?? ""} className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className={labelClass}>Buyer type</div>
            <select name="buyerType" defaultValue={buyer.buyerType ?? ""} className={inputClass}>
              <option value="">Select</option>
              {BUYER_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className={labelClass}>Year established</div>
            <input
              name="yearEstablished"
              type="number"
              inputMode="numeric"
              min={MIN_YEAR_ESTABLISHED}
              max={new Date().getFullYear()}
              placeholder="2010"
              defaultValue={buyer.yearEstablished ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <div className={labelClass}>Procurement frequency</div>
            <select name="procurementFrequency" defaultValue={buyer.procurementFrequency ?? ""} className={inputClass}>
              <option value="">Select</option>
              {PROCUREMENT_FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <GstFields
          countryIso={currentCountryIso}
          initialRegistered={buyer.gstRegistered}
          initialGstNumber={buyer.gstNumber}
        />
        <div>
          <div className={labelClass}>PAN (optional)</div>
          <input
            name="panNumber"
            placeholder="ABCDE1234F"
            maxLength={10}
            defaultValue={buyer.panNumber ?? ""}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
            className={`${inputClass} uppercase`}
          />
        </div>
      </Section>

      <Section title="Primary Contact">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={labelClass}>Contact person</div>
            <input name="name" required defaultValue={buyer.name ?? ""} className={inputClass} />
          </div>
          <div>
            <div className={labelClass}>Designation (optional)</div>
            <input
              name="designation"
              maxLength={100}
              placeholder="Purchase Manager"
              defaultValue={buyer.designation ?? ""}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={labelClass}>Business email (optional)</div>
            <input
              name="businessEmail"
              type="email"
              maxLength={254}
              placeholder="purchase@company.com"
              defaultValue={buyer.businessEmail ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <div className={labelClass}>Mobile number</div>
            <div className={`${readOnlyValueClass} font-mono`}>{buyer.phone}</div>
          </div>
        </div>
      </Section>

      <Section title="Business Address">
        <AddressFields
          countries={countries}
          showGst={false}
          onCountryChange={setCurrentCountryIso}
          initial={{
            countryIso,
            stateIso,
            city: buyer.city,
            pincode: buyer.pincode,
            addressLine1: buyer.addressLine1,
            addressLine2: buyer.addressLine2,
          }}
        />
      </Section>

      <div className="flex gap-2">
        <SubmitButton pendingText="Saving…" className={buttonClassName({ size: "sm" })}>
          Save changes
        </SubmitButton>
        <button type="button" onClick={onCancel} className={buttonClassName({ variant: "outline", size: "sm" })}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className={sectionTitleClass}>{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <div className={labelClass}>{label}</div>
      <div className={`${readOnlyValueClass} ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}
