import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { Metric, Placeholder, Stars, VerifiedBadge, buttonClassName, SubmitButton } from "@/components/ui";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Tag } from "@/components/catalog/Tag";
import { getSupplierBySlug } from "@/lib/catalog";
import { whatsappHref } from "@/lib/whatsapp";
import { getCurrentBuyerId } from "@/lib/session";
import { isSupplierSaved } from "@/lib/account";
import { toggleSaveSupplierAction } from "@/app/account/actions";

export const revalidate = 0;

export default async function SupplierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supplier = await getSupplierBySlug(slug);
  if (!supplier) notFound();

  const firstProduct = supplier.products[0];
  const buyerId = await getCurrentBuyerId();
  const saved = buyerId ? await isSupplierSaved(buyerId, supplier.id) : false;

  return (
    <div className="pb-10">
      <Placeholder label={`${supplier.name} · Facility`} height={180} rounded={false} />

      <div className="mx-auto max-w-6xl px-6">
        <div className="-mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-paper bg-ink text-3xl font-extrabold text-white">
            {supplier.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{supplier.name}</h1>
              <VerifiedBadge show={supplier.verified} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-sub">
              <span className="inline-flex items-center gap-1">
                <Icon name="pin" size={14} />
                {supplier.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Stars value={supplier.trustScore} size={13} /> ({supplier.reviewsCount} reviews)
              </span>
            </div>
          </div>
          <div className="flex w-full gap-2.5 sm:w-auto">
            {buyerId ? (
              <form action={toggleSaveSupplierAction}>
                <input type="hidden" name="supplierId" value={supplier.id} />
                <input type="hidden" name="supplierSlug" value={supplier.slug} />
                <SubmitButton
                  pendingText={saved ? "Removing…" : "Saving…"}
                  className={buttonClassName({ variant: saved ? "solid" : "outline", size: "sm", full: true })}
                >
                  <Icon name="heart" size={16} strokeWidth={2} />
                  {saved ? "Saved" : "Save"}
                </SubmitButton>
              </form>
            ) : (
              <Link
                href={`/account?next=${encodeURIComponent(`/supplier/${supplier.slug}`)}`}
                className={buttonClassName({ variant: "outline", size: "sm", full: true })}
              >
                <Icon name="heart" size={16} strokeWidth={2} /> Save
              </Link>
            )}
            {supplier.phone && (
              <a
                href={whatsappHref(supplier.phone, `Hi ${supplier.name}, I found your listing on NextGen and I'm interested in your products.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: "outline", size: "sm", full: true })}
              >
                <Icon name="whatsapp" size={16} strokeWidth={2} /> WhatsApp
              </a>
            )}
            <Link
              href={firstProduct ? `/rfq/new?product=${firstProduct.slug}` : "/rfq/new"}
              className={buttonClassName({ size: "sm", full: true })}
            >
              <Icon name="doc" size={16} strokeWidth={2} /> Send RFQ
            </Link>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line py-3">
            <Metric icon="star" value={supplier.trustScore.toFixed(1)} label="Trust score" />
          </div>
          <div className="rounded-2xl border border-line py-3">
            <Metric icon="clock" value={supplier.responseTime ?? "—"} label="Avg response" />
          </div>
          <div className="rounded-2xl border border-line py-3">
            <Metric icon="truck" value={`${supplier.deliveryPercent}%`} label="On-time delivery" />
          </div>
          <div className="rounded-2xl border border-line py-3">
            <Metric icon="shield" value={`${supplier.years} yrs`} label="In business" />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8 md:flex-row">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-extrabold text-ink">Catalog &middot; {supplier.products.length} products</h2>
            </div>
            {supplier.products.length === 0 ? (
              <div className="rounded-2xl border border-line p-8 text-center text-sm text-sub">
                No products listed yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {supplier.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>

          <aside className="flex-shrink-0 md:w-72">
            <div className="rounded-2xl border border-line p-5">
              <h3 className="mb-3 text-[15px] font-extrabold text-ink">About</h3>
              {supplier.blurb && <p className="text-[13.5px] leading-relaxed text-sub">{supplier.blurb}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {supplier.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              {supplier.gstNumber && (
                <div className="mt-4 border-t border-line pt-4 font-mono text-[11.5px] text-faint">
                  GSTIN &middot; {supplier.gstNumber}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
