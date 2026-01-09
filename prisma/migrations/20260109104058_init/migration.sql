/*
  Warnings:

  - You are about to drop the column `phone` on the `sms_verifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneNumber,type]` on the table `sms_verifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phoneNumber` to the `sms_verifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `sms_verifications_phone_type_key` ON `sms_verifications`;

-- AlterTable
ALTER TABLE `sms_verifications` DROP COLUMN `phone`,
    ADD COLUMN `phoneNumber` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `sms_verifications_phoneNumber_type_key` ON `sms_verifications`(`phoneNumber`, `type`);
