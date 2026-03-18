/*
  Warnings:

  - Added the required column `serviceFeatures` to the `service_translations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceFeatures` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `service_translations` ADD COLUMN `serviceFeatures` JSON NOT NULL;

-- AlterTable
ALTER TABLE `services` ADD COLUMN `serviceFeatures` JSON NOT NULL;
