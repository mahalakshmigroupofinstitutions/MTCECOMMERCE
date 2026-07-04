import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { Placeholder, Stars, buttonClassName } from "@/components/ui";
import { PriceTiers } from "@/components/catalog/PriceTiers";
import { SpecsTable } from "@/components/catalog/SpecsTable";
import { SupplierMiniCard } from "@/components/catalog/SupplierMiniCard";
import { getProductBySlug } from "@/lib/catalog";
import { whatsappHref } from "@/lib/whatsapp";

export const revalidate = 0;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const { supplier, category } = product;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <div className="mb-5 text-[12.5px] text-sub">
        <Link href="/">Home</Link> &middot;{" "}
        <Link href={`/search?category=${category.slug}`}>{category.name}</Link> &middot;{" "}
        <span className="font-bold text-ink">{product.title}</span>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="md:w-[420px] md:flex-shrink-0">
          <Placeholder label={product.title} height={280} />
          <div className="mt-2.5 flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Placeholder key={i} label="" height={64} className={`flex-1 ${i === 0 ? "" : "opacity-50"}`} />
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {product.verifiedProduct && (
            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-extrabold text-white">
              <Icon name="verified" size={13} strokeWidth={2.2} /> Verified product
            </div>
          )}
          <h1 className="text-xl leading-tight font-extrabold tracking-tight text-ink sm:text-2xl">{product.title}</h1>
          <div className="mt-2.5 flex items-center gap-3 text-[13px] text-sub">
            {product.rating !== null && <Stars value={product.rating} size={13} />}
            {product.ordersLabel && (
              <>
                <span>&middot;</span>
                <span>{product.ordersLabel} orders</span>
              </>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-wash p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[26px] font-extrabold text-ink">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              <span className="text-[13px] font-semibold text-sub">/ {product.unit}</span>
            </div>
            <div className="mt-1 text-[12px] text-sub">
              MOQ &middot; <b className="text-ink">{product.moq} {product.moqUnit}</b> &middot; inclusive of GST 18%
            </div>
            <PriceTiers tiers={product.tiers} />
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Link href={`/rfq/new?product=${product.slug}`} className={buttonClassName({ size: "lg", full: true })}>
              <Icon name="doc" size={18} strokeWidth={2} /> Get Best Quote
            </Link>
            <Link
              href={`/rfq/new?product=${product.slug}`}
              className={buttonClassName({ variant: "outline", size: "lg", full: true })}
            >
              Send Inquiry
            </Link>
            {supplier.phone && (
              <a
                href={whatsappHref(
                  supplier.phone,
                  `Hi ${supplier.name}, I'm interested in "${product.title}" listed on NextGen.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: "outline", size: "lg", full: true })}
              >
                <Icon name="whatsapp" size={18} strokeWidth={2} /> WhatsApp
              </a>
            )}
          </div>

          <SupplierMiniCard supplier={supplier} />
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-extrabold text-ink">Specifications</h2>
          <SpecsTable specs={product.specs} />
        </div>
        {product.description && (
          <div>
            <h2 className="mb-3 text-base font-extrabold text-ink">Description</h2>
            <p className="text-[13.5px] leading-relaxed text-sub">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
