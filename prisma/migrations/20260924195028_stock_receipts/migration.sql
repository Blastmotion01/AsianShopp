-- CreateTable
CREATE TABLE "StockReceipt" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "stockBefore" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "costBefore" INTEGER,
    "costAfter" INTEGER NOT NULL,
    "note" TEXT,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockReceipt_variantId_createdAt_idx" ON "StockReceipt"("variantId", "createdAt");

-- CreateIndex
CREATE INDEX "StockReceipt_createdAt_idx" ON "StockReceipt"("createdAt");

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
