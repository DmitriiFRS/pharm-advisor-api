-- AlterTable
ALTER TABLE `users` ADD COLUMN `passwordResetExpires` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` TEXT NULL;
