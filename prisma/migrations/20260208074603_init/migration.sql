-- AlterTable
ALTER TABLE `articles` ADD COLUMN `imageId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
