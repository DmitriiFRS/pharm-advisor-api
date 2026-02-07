/*
  Warnings:

  - A unique constraint covering the columns `[roleId,locale]` on the table `role_translations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `roles` ADD COLUMN `admin` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `role_translations_roleId_locale_key` ON `role_translations`(`roleId`, `locale`);
