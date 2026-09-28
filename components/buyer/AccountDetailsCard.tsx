"use client";

import { useActionState, useState } from "react";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { AddressFields } from "@/components/buyer/AddressFields";
import { updateProfile, type UpdateProfileState } from "@/app/(buyer)/account/actions";
import type { LocationOption } from "@/lib/location";

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";
const labelClass = "mb-1.5 text-[12px] font-bold text-ink";
const readOnlyValueClass = "rounded-xl border border-line bg-wash px-3.5 py-3 text-sm text-sub";

export interface AccountDetailsBuyer {
  phone: string;
  name: string | null;
  companyName: string | null;
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

/** Toggles the account page's Profile card between a read-only view and the
 * existing edit form — same page/route, same server action, no duplicate
 * update logic. Edit mode's fields, validation and Country/State/City/pincode
 * behavior are exactly what the form already had; only the view/edit
 * switching around it is new.
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
      <div className="flex flex-col gap-3">
        <Field label="Mobile number" value={buyer.phone} mono />
        <Field label="Name" value={buyer.name} />
        <Field label="Company name" value={buyer.companyName} />
        <Field label="GSTIN" value={buyer.gstNumber} />
        <Field label="Address line 1" value={buyer.addressLine1} />
        <Field label="Address line 2" value={buyer.addressLine2} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Country" value={buyer.country} />
          <Field label="State" value={buyer.state} />
          <Field label="City" value={buyer.city} />
        </div>
        <Field label="Pincode" value={buyer.pincode} />
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

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <div className={labelClass}>Mobile number</div>
        <div className="rounded-xl border border-line bg-wash px-3.5 py-3 font-mono text-sm text-sub">{buyer.phone}</div>
      </div>
      {state.error && (
        <p className="rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">{state.error}</p>
      )}
      <div>
        <div className={labelClass}>Name</div>
        <input name="name" defaultValue={buyer.name ?? ""} className={inputClass} />
      </div>
      <div>
        <div className={labelClass}>Company name</div>
        <input name="companyName" defaultValue={buyer.companyName ?? ""} className={inputClass} />
      </div>
      <AddressFields
        countries={countries}
        initial={{
          countryIso,
          stateIso,
          city: buyer.city,
          pincode: buyer.pincode,
          addressLine1: buyer.addressLine1,
          addressLine2: buyer.addressLine2,
          gstNumber: buyer.gstNumber,
        }}
      />
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

function Field({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <div className={labelClass}>{label}</div>
      <div className={`${readOnlyValueClass} ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}
