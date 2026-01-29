/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `users_phoneNumber_key` ON `users`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `phoneNumber`,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_email_key` ON `users`(`email`);
