/* Vendor/RFQ file storage — backed by Vercel Blob (@vercel/blob). Replaces
 * the previous local-disk implementation, which only ever worked in local
 * dev: Vercel's production filesystem is read-only outside /tmp, so every
 * write here used to throw in production. Exported function names/
 * signatures are unchanged from before so every existing caller works as-is.
 *
 * PUBLIC objects (product/vendor/shop imagery) use Blob's access:"public" —
 * the returned URL is what gets rendered directly in <Image>/<img>.
 *
 * PRIVATE objects (KYC documents, shop certifications, RFQ attachments) use
 * access:"private" — Blob itself enforces this: fetching the URL without the
 * read-write token is rejected. The stored `filePath`/`imageUrl` value is the
 * Blob URL; only readPrivateFile() below (used by the authenticated API
 * routes) can actually retrieve the bytes. The raw URL is never sent to the
 * browser for these.
 *
 * Backward compatibility: rows created before this migration hold an old
 * relative local path (e.g. "vendor-documents/{id}/{uuid}.pdf" or
 * "/vendor-logos/{id}/{file}"). Those can't be resolved anymore — and since
 * production writes always threw before this change, no such row could ever
 * have been the result of a successful production upload in the first place.
 * Reads for a legacy value fail gracefully (null / 404), not with a throw. */
import "server-only";
import { put, del, get } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import path from "node:path";

export interface SavedFile {
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_CERTIFICATION_BYTES = 5 * 1024 * 1024;
/** Matches the RFQ form's own stated "up to 15MB". */
export const MAX_RFQ_ATTACHMENT_BYTES = 15 * 1024 * 1024;

/* SVG is deliberately excluded: public images are rendered directly, and an
 * SVG can carry inline script. */
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const ALLOWED_CERTIFICATION_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];
/* Matches the RFQ form's own accept list (PDF, JPG, PNG, DWG, Excel).
 * application/octet-stream — and even an empty file.type — are allowed
 * alongside the real MIME types because browsers frequently report no
 * reliable MIME type for .dwg (and sometimes .xls/.xlsx) files; without this
 * the type check would reject files the form itself advertises as accepted. */
export const ALLOWED_RFQ_ATTACHMENT_TYPES = [
  ...ALLOWED_CERTIFICATION_TYPES,
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
  "",
];

export type UploadRejection = "type" | "size";

/** Server-side upload gate. Returns null when the file is acceptable, or the
 * reason it was rejected — callers map that onto an ?error= code. */
export function validateUpload(
  file: File,
  options: { allowed: string[]; maxBytes: number },
): UploadRejection | null {
  if (!options.allowed.includes(file.type)) return "type";
  if (file.size > options.maxBytes) return "size";
  return null;
}

function uniqueName(file: File, prefix?: string): string {
  const ext = path.extname(file.name) || "";
  return prefix ? `${prefix}-${randomUUID()}${ext}` : `${randomUUID()}${ext}`;
}

/** True for a value this module itself wrote (a real Blob URL) — false for a
 * pre-migration legacy local path (see module doc comment above). */
function isBlobUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

// ---------------------------------------------------------------- private

export async function saveVendorDocument(file: File, supplierId: string): Promise<SavedFile> {
  const pathname = `vendor-documents/${supplierId}/${uniqueName(file)}`;
  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });

  return {
    filePath: blob.url,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
  };
}

/** Shop certifications stay private (same rationale as KYC documents) and are
 * served only through the authenticated certification route. */
export async function saveVendorShopCertification(file: File, supplierId: string): Promise<SavedFile> {
  const pathname = `shop-certifications/${supplierId}/${uniqueName(file)}`;
  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });

  return {
    filePath: blob.url,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
  };
}

/** RFQ spec sheet / BOQ attachment — private for the same reason vendor KYC
 * documents are: it can carry pricing/technical detail the buyer didn't post
 * publicly. Reuses this same module rather than a second storage system. */
export async function saveRfqAttachment(file: File, buyerId: string): Promise<SavedFile> {
  const pathname = `rfq-attachments/${buyerId}/${uniqueName(file)}`;
  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });

  return {
    filePath: blob.url,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
  };
}

/** Streams a private object's bytes for one of the authenticated download
 * routes. Returns null for a legacy pre-migration filePath or a missing
 * object — callers should respond 404, never throw, on null. */
export async function readPrivateFile(
  filePath: string,
): Promise<{ stream: ReadableStream; contentType: string } | null> {
  if (!isBlobUrl(filePath)) return null;
  const result = await get(filePath, { access: "private" });
  if (!result?.stream) return null;
  return { stream: result.stream, contentType: result.blob.contentType };
}

/** @deprecated Private files are now fetched via readPrivateFile(), not a
 * resolved local disk path — there is no local disk in production. Kept as a
 * pass-through only so its exported signature doesn't change out from under
 * any caller that still imports it. */
export function resolveVendorDocumentPath(filePath: string): string {
  return filePath;
}

// ----------------------------------------------------------------- public

/** Returns a root-relative URL suitable for Supplier.imageUrl / next/image. */
export async function saveVendorLogo(file: File, supplierId: string): Promise<string> {
  return saveVendorPublicImage(file, supplierId, "logo");
}

/** Publicly-readable vendor imagery (onboarding logo, product photo, shop
 * logo, shop banner). `prefix` only makes the stored filename recognisable;
 * uniqueness comes from the UUID regardless. */
export async function saveVendorPublicImage(
  file: File,
  supplierId: string,
  prefix: string,
): Promise<string> {
  const pathname = `vendor-images/${supplierId}/${uniqueName(file, prefix)}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });
  return blob.url;
}

/** Best-effort cleanup when a vendor replaces or removes branding/a product
 * photo. Never throws — losing the old file is not worth failing the
 * surrounding mutation over. A legacy (pre-Blob) URL is silently skipped:
 * this module can no longer reach that file, and it was never actually
 * reachable in production anyway (see module doc comment). */
export async function deleteVendorPublicImage(url: string | null | undefined): Promise<void> {
  if (!url || !isBlobUrl(url)) return;
  try {
    await del(url);
  } catch {
    // already gone, or never written — nothing to clean up
  }
}

/** Best-effort cleanup for a private upload (see deleteVendorPublicImage). */
export async function deleteVendorPrivateFile(filePath: string): Promise<void> {
  if (!filePath || !isBlobUrl(filePath)) return;
  try {
    await del(filePath);
  } catch {
    // already gone
  }
}
