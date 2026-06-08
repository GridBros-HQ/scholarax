/*
  Warnings:

  - You are about to drop the column `type` on the `campuses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[school_group_id,code]` on the table `campuses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[campus_id,slug]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `school_groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,role_id,campus_id]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[campus_id,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `campuses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `curriculum_type` to the `campuses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campus_id` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `name` on the `roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `slug` to the `school_groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campus_id` to the `user_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campus_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "roles_name_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "campuses" DROP COLUMN "type",
ADD COLUMN     "code" VARCHAR(50) NOT NULL,
ADD COLUMN     "curriculum_type" "CurriculumType" NOT NULL;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "campus_id" UUID NOT NULL,
ADD COLUMN     "slug" VARCHAR(100) NOT NULL,
DROP COLUMN "name",
ADD COLUMN     "name" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "school_groups" ADD COLUMN     "slug" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN     "campus_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "campus_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "campuses_school_group_id_code_key" ON "campuses"("school_group_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_campus_id_slug_key" ON "roles"("campus_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "school_groups_slug_key" ON "school_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_campus_id_key" ON "user_roles"("user_id", "role_id", "campus_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_campus_id_email_key" ON "users"("campus_id", "email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- ============================================================
-- APPENDED: DATABASE ROW-LEVEL SECURITY (RLS) POLICIES
-- Enforces logical multi-tenant isolation at the storage level.
-- ============================================================

-- 1. Enable Row-Level Security on All Tenant-Scoped Tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_discipline_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- 2. Define Standard Campus Isolation Policies via Dynamic Procedural Loop
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users', 'roles', 'user_roles', 'academic_years', 'terms', 
        'classes', 'streams', 'subjects', 'class_subjects', 'students', 
        'student_medical_records', 'student_discipline_records', 'departments', 
        'staff_assignments', 'teacher_subject_assignments', 'fee_categories', 
        'fee_structures', 'student_fee_assignments', 'fee_invoices', 
        'fee_payments', 'payment_receipts', 'attendance_sessions', 
        'attendance_records', 'inventory_categories', 'inventory_items', 
        'inventory_transactions', 'announcements', 'sms_logs'
    ]
    LOOP
        EXECUTE format(
            $body$CREATE POLICY campus_isolation_policy ON %I
             FOR ALL
             USING (campus_id = NULLIF(current_setting('app.current_campus_id', true), '')::uuid)
             WITH CHECK (campus_id = NULLIF(current_setting('app.current_campus_id', true), '')::uuid)$body$,
            t
        );
    END LOOP;
END;
$$;

-- 3. Define Specialized Policies for Structural Edge-Cases
CREATE POLICY notification_template_policy ON notification_templates
    FOR ALL
    USING (
        campus_id IS NULL OR 
        campus_id = NULLIF(current_setting('app.current_campus_id', true), '')::uuid
    );

-- Fixed to align perfectly with your explicit table layout
CREATE POLICY student_transfer_isolation_policy ON student_transfers
    FOR ALL
    USING (
        source_campus_id = NULLIF(current_setting('app.current_campus_id', true), '')::uuid OR
        destination_campus_id = NULLIF(current_setting('app.current_campus_id', true), '')::uuid
    );