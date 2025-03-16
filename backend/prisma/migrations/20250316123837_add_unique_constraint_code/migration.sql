/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Test` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Test_code_key` ON `Test`(`code`);
