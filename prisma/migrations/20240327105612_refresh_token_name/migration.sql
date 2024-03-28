/*
  Warnings:

  - You are about to drop the column `hashedRefreshtoken` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "hashedRefreshtoken",
ADD COLUMN     "hashedRefreshToken" TEXT;
