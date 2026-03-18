/*
  Warnings:

  - You are about to drop the `service_feature_translations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_features` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `service_feature_translations` DROP FOREIGN KEY `service_feature_translations_serviceFeatureId_fkey`;

-- DropForeignKey
ALTER TABLE `service_features` DROP FOREIGN KEY `service_features_serviceId_fkey`;

-- DropTable
DROP TABLE `service_feature_translations`;

-- DropTable
DROP TABLE `service_features`;
