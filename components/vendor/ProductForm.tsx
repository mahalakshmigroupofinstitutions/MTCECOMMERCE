"use client";

import { useRef, useState } from "react";
import { buttonClassName, CatalogImage, FileInput, FormField, SubmitButton } from "@/components/ui";
import { saveVendorProduct } from "@/app/vendor/actions";
import type { CategoryRow } from "@/lib/catalog";

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

function specsToText(specs: unknown) {
  if (!Array.isArray(specs)) return "";
  return specs
    .filter((row): row is [string, string] => Array.isArray(row) && row.length === 2)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

function tiersToText(tiers: unknown) {
  if (!Array.isArray(tiers)) return "";
  return tiers
    .filter((row): row is [string, string] => Array.isArray(row) && row.length === 2)
    .map(([range, price]) => `${range} | ${price}`)
    .join("\n");
}

export interface ProductFormProps {
  categories: CategoryRow[];
  /** Passed down from the (server) page rather than imported here, since
   * lib/localFileStorage.ts is server-only and this is a Client Component. */
  imageAccept: string;
  maxImageMb: number;
  product?: {
    id: string;
    title: string;
    categoryId: string;
    unit: string;
    price: number;
    moq: number;
    moqUnit: string;
    specs: unknown;
    tiers: unknown;
    description: string | null;
    imageUrl: string | null;
  };
  error?: string;
}

export function ProductForm({ categories, imageAccept, maxImageMb, product, error }: ProductFormProps) {
  const isCreate = !product;
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<"form" | "review">("form");

  // Controlled only for the fields the Quotation Verification review shows —
  // everything else (specs, tiers, description, image) stays uncontrolled
  // since it isn't part of that review.
  const [title, setTitle] = useState(product?.title ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [price, setPrice] = useState(product?.price !== undefined ? String(product.price) : "");
  const [unit, setUnit] = useState(product?.unit ?? "");
  const [moq, setMoq] = useState(product?.moq !== undefined ? String(product.moq) : "");
  const [moqUnit, setMoqUnit] = useState(product?.moqUnit ?? "");

  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  function handleContinueToReview() {
    if (!formRef.current?.reportValidity()) return;
    setStep("review");
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <h1 className="text-lg font-extrabold text-ink">
        {product ? "Edit product" : step === "review" ? "Quotation verification" : "Add a product"}
      </h1>
      {error && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          {error === "image"
            ? `Please upload a PNG, JPG or WebP photo up to ${maxImageMb} MB.`
            : "Please fill in all required fields."}
        </p>
      )}
      <form ref={formRef} action={saveVendorProduct} className="mt-5 flex flex-col gap-4">
        {product && <input type="hidden" name="productId" value={product.id} />}

        <div className={isCreate && step === "review" ? "hidden" : "flex flex-col gap-4"}>
          <FormField
            htmlFor="image"
            label="Product photo (optional)"
            hint={`Shown to buyers on your listing. PNG, JPG or WebP, up to ${maxImageMb} MB.`}
          >
            <div className="mb-3">
              <CatalogImage src={product?.imageUrl} label={product?.title ?? "Product photo"} height={160} />
            </div>
            <FileInput id="image" name="image" accept={imageAccept} />
          </FormField>

          {product?.imageUrl && (
            <label className="-mt-2 flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-sub">
              <input type="checkbox" name="removeImage" className="h-3.5 w-3.5 accent-[var(--color-accent)]" />
              Remove current photo
            </label>
          )}

          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Title</div>
            <input
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Category</div>
            <select
              name="categoryId"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <div className="mb-1.5 text-[12.5px] font-bold text-ink">Price</div>
              <input
                name="price"
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <div className="mb-1.5 text-[12.5px] font-bold text-ink">Unit</div>
              <input
                name="unit"
                required
                placeholder="ton"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <div className="mb-1.5 text-[12.5px] font-bold text-ink">MOQ</div>
              <input
                name="moq"
                type="number"
                required
                min="1"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <div className="mb-1.5 text-[12.5px] font-bold text-ink">MOQ unit</div>
              <input
                name="moqUnit"
                required
                placeholder="tons"
                value={moqUnit}
                onChange={(e) => setMoqUnit(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Specifications (optional)</div>
            <textarea
              name="specs"
              rows={4}
              placeholder={"One per line, Key: Value\nGrade: Fe-500D (IS 1786)\nDiameter: 12 mm"}
              defaultValue={specsToText(product?.specs)}
              className={`${inputClass} resize-none font-mono text-[12.5px]`}
            />
          </div>

          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Bulk price tiers (optional)</div>
            <textarea
              name="tiers"
              rows={3}
              placeholder={"One per line, range | price\n5 – 24 tons | ₹54,200 /ton"}
              defaultValue={tiersToText(product?.tiers)}
              className={`${inputClass} resize-none font-mono text-[12.5px]`}
            />
          </div>

          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Description (optional)</div>
            <textarea
              name="description"
              rows={3}
              defaultValue={product?.description ?? ""}
              className={`${inputClass} resize-none`}
            />
          </div>

          {isCreate ? (
            <button
              type="button"
              onClick={handleContinueToReview}
              className={buttonClassName({ variant: "success", full: true, size: "lg" })}
            >
              Continue to review
            </button>
          ) : (
            <SubmitButton pendingText="Saving…" className={buttonClassName({ variant: "success", full: true, size: "lg" })}>
              Save changes
            </SubmitButton>
          )}
        </div>

        {isCreate && step === "review" && (
          <div className="flex flex-col gap-4">
            <p className="text-[12.5px] text-sub">
              A quotation will be created and permanently linked to this product. Review the details below before
              submitting — you can still come back and edit them.
            </p>

            <dl className="flex flex-col gap-2.5 rounded-2xl border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[12.5px] font-semibold text-sub">Product</dt>
                <dd className="text-right text-sm font-bold text-ink">{title || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[12.5px] font-semibold text-sub">Category</dt>
                <dd className="text-right text-sm text-ink">{categoryName ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[12.5px] font-semibold text-sub">Price</dt>
                <dd className="text-right text-sm font-bold text-ink">
                  ₹{price || "0"} / {unit || "unit"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[12.5px] font-semibold text-sub">MOQ</dt>
                <dd className="text-right text-sm text-ink">
                  {moq || "0"} {moqUnit}
                </dd>
              </div>
            </dl>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("form")}
                className={buttonClassName({ variant: "ghost", full: true, size: "lg" })}
              >
                Edit
              </button>
              <SubmitButton
                pendingText="Submitting…"
                className={buttonClassName({ variant: "success", full: true, size: "lg" })}
              >
                Confirm & submit
              </SubmitButton>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
