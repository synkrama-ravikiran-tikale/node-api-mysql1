/*
  Warnings:

  - You are about to drop the column `profileImg` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `profileImg`,
    ADD COLUMN `photo` VARCHAR(191) NULL;
