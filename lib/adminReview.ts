import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminId } from "@/lib/adminSession";
import type { SupplierOnboardingStatus } from "@/lib/generated/prisma/client";

/** Statuses a submitted vendor can be in, in the order the queue tabs show them. */
export const REVIEW_QUEUE_STATUSES = [
  "PENDING_VERIFICATION",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
] as const satisfies readonly SupplierOnboardingStatus[];

export type ReviewQueueStatus = (typeof REVIEW_QUEUE_STATUSES)[number];

export const STATUS_LABELS: Record<ReviewQueueStatus, string> = {
  PENDING_VERIFICATION: "Pending",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/** Server-Component page guard for /admin/*. Bounces anyone without a valid
 * admin session to the login page; returns the admin row for header display. */
export async function requireAdmin() {
  const adminId = await getCurrentAdminId();
  if (!adminId) redirect("/admin/login");

  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) redirect("/admin/login");

  return admin;
}

export async function getVendorQueue(status: ReviewQueueStatus) {
  return prisma.supplier.findMany({
    where: { onboardingStatus: status },
    orderBy: { updatedAt: "desc" },
    include: { businessCategory: true, reviewedBy: true },
  });
}

/** Row counts for every queue tab, in one grouped query. */
export async function getQueueCounts(): Promise<Record<ReviewQueueStatus, number>> {
  const grouped = await prisma.supplier.groupBy({
    by: ["onboardingStatus"],
    _count: { _all: true },
  });

  const counts = Object.fromEntries(REVIEW_QUEUE_STATUSES.map((s) => [s, 0])) as Record<ReviewQueueStatus, number>;
  for (const row of grouped) {
    if ((REVIEW_QUEUE_STATUSES as readonly string[]).includes(row.onboardingStatus)) {
      counts[row.onboardingStatus as ReviewQueueStatus] = row._count._all;
    }
  }
  return counts;
}

export async function getVendorSubmission(supplierId: string) {
  return prisma.supplier.findUnique({
    where: { id: supplierId },
    include: { businessCategory: true, documents: true, bankDetail: true, reviewedBy: true },
  });
}

export type VendorSubmission = NonNullable<Awaited<ReturnType<typeof getVendorSubmission>>>;

async function recordDecision(
  supplierId: string,
  adminId: string,
  data: { onboardingStatus: SupplierOnboardingStatus; verified?: boolean; reviewNote?: string | null },
) {
  return prisma.supplier.update({
    where: { id: supplierId },
    data: { ...data, reviewedAt: new Date(), reviewedById: adminId },
  });
}

/** Marks a submission as actively being reviewed, so two admins don't duplicate work. */
export async function claimVendorForReview(supplierId: string, adminId: string) {
  return recordDecision(supplierId, adminId, { onboardingStatus: "UNDER_REVIEW" });
}

/** Approval makes the vendor visible in the buyer catalog (onboardingStatus) and
 * flips the existing `verified` flag that drives VerifiedBadge across the buyer UI. */
export async function approveVendor(supplierId: string, adminId: string, note?: string) {
  return recordDecision(supplierId, adminId, {
    onboardingStatus: "APPROVED",
    verified: true,
    reviewNote: note ?? null,
  });
}

export async function rejectVendor(supplierId: string, adminId: string, note: string) {
  return recordDecision(supplierId, adminId, {
    onboardingStatus: "REJECTED",
    verified: false,
    reviewNote: note,
  });
}

/** Sends the submission back to the vendor for fixes without rejecting outright. */
export async function requestChanges(supplierId: string, adminId: string, note: string) {
  return recordDecision(supplierId, adminId, {
    onboardingStatus: "CHANGES_REQUESTED",
    verified: false,
    reviewNote: note,
  });
}
