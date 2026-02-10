-- AlterTable
ALTER TABLE `articles` ADD COLUMN `pdfId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_pdfId_fkey` FOREIGN KEY (`pdfId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
