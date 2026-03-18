/*
  Warnings:

  - You are about to drop the column `background_icon` on the `services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `services` DROP COLUMN `background_icon`,
    ADD COLUMN `imageId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
