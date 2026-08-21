/* Local-disk vendor file storage — stopgap until a cloud provider (S3/Vercel
 * Blob) is approved. Two distinct paths: KYC documents stay private (served
 * only through the authenticated /api/vendor/documents route), while the
 * company logo needs to be publicly viewable on the storefront, so it's
 * written under /public instead. Swapping either for cloud storage later
 * only means changing the body of these two functions. */
import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const PRIVATE_UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const PUBLIC_LOGO_ROOT = path.join(process.cwd(), "public", "vendor-logos");
/* Public URL prefix that PUBLIC_LOGO_ROOT is served from. Shop branding reuses
 * this same root rather than introducing a second public directory — /public/
 * vendor-logos is already in .gitignore, so vendor uploads can never be
 * committed by accident. */
const PUBLIC_URL_PREFIX = "/vendor-logos";

export interface SavedFile {
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_CERTIFICATION_BYTES = 5 * 1024 * 1024;

/* SVG is deliberately excluded: these files are served from /public, and an SVG
 * can carry inline script. */
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const ALLOWED_CERTIFICATION_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

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

export async function saveVendorDocument(file: File, supplierId: string): Promise<SavedFile> {
  const dir = path.join(PRIVATE_UPLOAD_ROOT, "vendor-documents", supplierId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const storedName = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));

  return {
    filePath: path.posix.join("vendor-documents", supplierId, storedName),
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
  };
}

export function resolveVendorDocumentPath(filePath: string) {
  return path.join(PRIVATE_UPLOAD_ROOT, filePath);
}

/** Returns a root-relative URL suitable for Supplier.imageUrl / next/image. */
export async function saveVendorLogo(file: File, supplierId: string): Promise<string> {
  return saveVendorPublicImage(file, supplierId, "logo");
}

/** Publicly-readable vendor imagery (onboarding logo, shop logo, shop banner).
 * `prefix` only makes the stored filename recognisable on disk — uniqueness
 * still comes from the UUID. */
export async function saveVendorPublicImage(
  file: File,
  supplierId: string,
  prefix: string,
): Promise<string> {
  const dir = path.join(PUBLIC_LOGO_ROOT, supplierId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const storedName = `${prefix}-${randomUUID()}${ext}`;
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));

  return `${PUBLIC_URL_PREFIX}/${supplierId}/${storedName}`;
}

/** Shop certifications stay private (same rationale as KYC documents) and are
 * served only through the authenticated certification route. */
export async function saveVendorShopCertification(file: File, supplierId: string): Promise<SavedFile> {
  const dir = path.join(PRIVATE_UPLOAD_ROOT, "shop-certifications", supplierId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const storedName = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));

  return {
    filePath: path.posix.join("shop-certifications", supplierId, storedName),
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
  };
}

/** Best-effort cleanup when a vendor replaces or removes branding. Refuses any
 * URL outside the public vendor-image root so a bad DB value can never delete
 * an arbitrary file, and never throws — losing the file is not worth failing
 * the surrounding mutation over. */
export async function deleteVendorPublicImage(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith(`${PUBLIC_URL_PREFIX}/`)) return;
  const relative = url.slice(PUBLIC_URL_PREFIX.length + 1);
  if (relative.includes("..")) return;
  try {
    await unlink(path.join(PUBLIC_LOGO_ROOT, ...relative.split("/")));
  } catch {
    // already gone, or never written — nothing to clean up
  }
}

/** Best-effort cleanup for a private upload (see deleteVendorPublicImage). */
export async function deleteVendorPrivateFile(filePath: string): Promise<void> {
  if (!filePath || filePath.includes("..")) return;
  try {
    await unlink(resolveVendorDocumentPath(filePath));
  } catch {
    // already gone
  }
}
