import { buttonClassName, SubmitButton } from "@/components/ui";
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
  };
  error?: boolean;
}

export function ProductForm({ categories, product, error }: ProductFormProps) {
  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <h1 className="text-lg font-extrabold text-ink">{product ? "Edit product" : "Add a product"}</h1>
      {error && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Please fill in all required fields.
        </p>
      )}
      <form action={saveVendorProduct} className="mt-5 flex flex-col gap-4">
        {product && <input type="hidden" name="productId" value={product.id} />}

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Title</div>
          <input name="title" required defaultValue={product?.title} className={inputClass} />
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Category</div>
          <select name="categoryId" required defaultValue={product?.categoryId ?? ""} className={inputClass}>
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
            <input name="price" type="number" required min="0" defaultValue={product?.price} className={inputClass} />
          </div>
          <div className="flex-1">
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Unit</div>
            <input name="unit" required placeholder="ton" defaultValue={product?.unit} className={inputClass} />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">MOQ</div>
            <input name="moq" type="number" required min="1" defaultValue={product?.moq} className={inputClass} />
          </div>
          <div className="flex-1">
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">MOQ unit</div>
            <input name="moqUnit" required placeholder="tons" defaultValue={product?.moqUnit} className={inputClass} />
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

        <SubmitButton pendingText="Saving…" className={buttonClassName({ full: true, size: "lg" })}>
          {product ? "Save changes" : "Add product"}
        </SubmitButton>
      </form>
    </div>
  );
}
