/*
  Warnings:

  - You are about to drop the column `attendance_session_id` on the `attendance_records` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[student_id,date]` on the table `attendance_records` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `attendance_records` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('EXAM', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'LAB');

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_attendance_session_id_fkey";

-- DropIndex
DROP INDEX "attendance_records_attendance_session_id_student_id_key";

-- AlterTable
ALTER TABLE "attendance_records" DROP COLUMN "attendance_session_id",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ALTER COLUMN "remarks" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "max_points" DOUBLE PRECISION NOT NULL,
    "weight_percentage" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_campus_idx" ON "attendance_records"("campus_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_student_id_date_key" ON "attendance_records"("student_id", "date");
