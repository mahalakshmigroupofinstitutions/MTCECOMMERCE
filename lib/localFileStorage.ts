/* Local-disk vendor file storage — stopgap until a cloud provider (S3/Vercel
 * Blob) is approved. Two distinct paths: KYC documents stay private (served
 * only through the authenticated /api/vendor/documents route), while the
 * company logo needs to be publicly viewable on the storefront, so it's
 * written under /public instead. Swapping either for cloud storage later
 * only means changing the body of these two functions. */
import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const PRIVATE_UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const PUBLIC_LOGO_ROOT = path.join(process.cwd(), "public", "vendor-logos");

export interface SavedFile {
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
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
  const dir = path.join(PUBLIC_LOGO_ROOT, supplierId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const storedName = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));

  return `/vendor-logos/${supplierId}/${storedName}`;
}
