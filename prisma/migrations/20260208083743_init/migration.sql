-- DropForeignKey
ALTER TABLE `articles` DROP FOREIGN KEY `articles_imageId_fkey`;

-- DropIndex
DROP INDEX `articles_imageId_fkey` ON `articles`;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
