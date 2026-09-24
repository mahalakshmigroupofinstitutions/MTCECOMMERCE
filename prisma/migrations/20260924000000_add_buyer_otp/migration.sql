-- Additive-only migration for buyer phone OTP (registration/login).

-- CreateEnum
CREATE TYPE "BuyerOtpPurpose" AS ENUM ('REGISTER', 'LOGIN');

-- AlterTable
ALTER TABLE "Buyer" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BuyerOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" "BuyerOtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuyerOtp_phone_purpose_idx" ON "BuyerOtp"("phone", "purpose");
