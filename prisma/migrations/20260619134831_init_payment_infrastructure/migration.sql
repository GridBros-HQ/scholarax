/*
  Warnings:

  - The primary key for the `assessments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `title` on the `assessments` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Changed the type of `id` on the `assessments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `campus_id` on the `assessments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `academic_year_id` on the `assessments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `subject_id` on the `assessments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RECONCILED');

-- AlterTable
ALTER TABLE "assessments" DROP CONSTRAINT "assessments_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "campus_id",
ADD COLUMN     "campus_id" UUID NOT NULL,
DROP COLUMN "academic_year_id",
ADD COLUMN     "academic_year_id" UUID NOT NULL,
DROP COLUMN "subject_id",
ADD COLUMN     "subject_id" UUID NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ,
ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "grade_records" (
    "id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "grade_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_components" (
    "id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "fee_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_packages" (
    "id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "fee_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_package_items" (
    "id" UUID NOT NULL,
    "fee_package_id" UUID NOT NULL,
    "fee_component_id" UUID NOT NULL,

    CONSTRAINT "fee_package_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_gateway_configs" (
    "id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "short_code" TEXT NOT NULL,
    "consumer_key" VARCHAR(500) NOT NULL,
    "consumer_secret" VARCHAR(500) NOT NULL,
    "passkey" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mpesa_transactions" (
    "id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "phone_number" TEXT NOT NULL,
    "checkout_request_id" TEXT NOT NULL,
    "merchant_request_id" TEXT NOT NULL,
    "mpesa_receipt_number" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failure_reason" TEXT,
    "raw_callback_dump" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mpesa_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_audit_trails" (
    "id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ip_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_audit_trails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grades_campus_idx" ON "grade_records"("campus_id");

-- CreateIndex
CREATE UNIQUE INDEX "grade_records_student_id_assessment_id_key" ON "grade_records"("student_id", "assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_package_items_fee_package_id_fee_component_id_key" ON "fee_package_items"("fee_package_id", "fee_component_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateway_configs_campus_id_key" ON "payment_gateway_configs"("campus_id");

-- CreateIndex
CREATE INDEX "payment_gateway_configs_campus_id_idx" ON "payment_gateway_configs"("campus_id");

-- CreateIndex
CREATE UNIQUE INDEX "mpesa_transactions_checkout_request_id_key" ON "mpesa_transactions"("checkout_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "mpesa_transactions_mpesa_receipt_number_key" ON "mpesa_transactions"("mpesa_receipt_number");

-- CreateIndex
CREATE INDEX "mpesa_transactions_campus_id_idx" ON "mpesa_transactions"("campus_id");

-- CreateIndex
CREATE INDEX "mpesa_transactions_checkout_request_id_idx" ON "mpesa_transactions"("checkout_request_id");

-- CreateIndex
CREATE INDEX "mpesa_transactions_mpesa_receipt_number_idx" ON "mpesa_transactions"("mpesa_receipt_number");

-- CreateIndex
CREATE INDEX "payment_audit_trails_campus_id_idx" ON "payment_audit_trails"("campus_id");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_records" ADD CONSTRAINT "grade_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_records" ADD CONSTRAINT "grade_records_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_package_items" ADD CONSTRAINT "fee_package_items_fee_package_id_fkey" FOREIGN KEY ("fee_package_id") REFERENCES "fee_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_package_items" ADD CONSTRAINT "fee_package_items_fee_component_id_fkey" FOREIGN KEY ("fee_component_id") REFERENCES "fee_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
