/* Certification documents live under the private upload root, not /public, so
 * this authenticated route is the only way to read one — and only the vendor
 * who owns the shop it belongs to can. Mirrors the KYC document route. */
import { NextResponse } from "next/server";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { readPrivateFile } from "@/lib/localFileStorage";
import { getShopCertificationForSupplier } from "@/lib/vendorShop";

export async function GET(_req: Request, { params }: { params: Promise<{ certificationId: string }> }) {
  const { certificationId } = await params;

  const supplierId = await getCurrentSupplierId();
  if (!supplierId) return new NextResponse("Unauthorized", { status: 401 });

  const certification = await getShopCertificationForSupplier(supplierId, certificationId);
  if (!certification) return new NextResponse("Not found", { status: 404 });

  const file = await readPrivateFile(certification.filePath);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": certification.mimeType,
      "Content-Disposition": `inline; filename="${certification.fileName}"`,
    },
  });
}
