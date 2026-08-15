import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getCurrentAdminId } from "@/lib/adminSession";
import { resolveVendorDocumentPath } from "@/lib/localFileStorage";

/* Readable by the vendor who uploaded the document, or by any admin (they have
 * to open KYC documents to verify them). Vendor lookups stay scoped to their own
 * supplierId so one vendor still can't read another's documents. */
export async function GET(_req: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;

  const [supplierId, adminId] = await Promise.all([getCurrentSupplierId(), getCurrentAdminId()]);
  if (!supplierId && !adminId) return new NextResponse("Unauthorized", { status: 401 });

  const doc = await prisma.supplierDocument.findFirst({
    where: adminId ? { id: documentId } : { id: documentId, supplierId: supplierId! },
  });
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const buffer = await readFile(resolveVendorDocumentPath(doc.filePath));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${doc.fileName}"`,
    },
  });
}
