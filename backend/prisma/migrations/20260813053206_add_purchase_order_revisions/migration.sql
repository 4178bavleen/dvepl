-- CreateTable
CREATE TABLE "purchase_order_revisions" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "vendorId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "poDate" TEXT NOT NULL,
    "poStatus" TEXT NOT NULL,
    "paymentTerms" TEXT,
    "materialStatus" TEXT,
    "advance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "cgstPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "termsAndConditions" TEXT,
    "lineItems" JSONB NOT NULL,
    "companyDetails" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "customColumns" JSONB,
    "referenceCode" TEXT,

    CONSTRAINT "purchase_order_revisions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "purchase_order_revisions" ADD CONSTRAINT "purchase_order_revisions_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_revisions" ADD CONSTRAINT "purchase_order_revisions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
