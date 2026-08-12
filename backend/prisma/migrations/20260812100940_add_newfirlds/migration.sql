-- CreateEnum
CREATE TYPE "CustomerDrawingReviewStatus" AS ENUM ('NOT_SENT', 'SENT_FOR_REVIEW', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED');

-- CreateTable
CREATE TABLE "customer_drawing_reviews" (
    "id" TEXT NOT NULL,
    "drawingId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "contactPersonId" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "status" "CustomerDrawingReviewStatus" NOT NULL DEFAULT 'NOT_SENT',
    "message" TEXT,
    "sentAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "customerComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "customer_drawing_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_drawing_reviews_drawingId_idx" ON "customer_drawing_reviews"("drawingId");

-- CreateIndex
CREATE INDEX "customer_drawing_reviews_revisionId_idx" ON "customer_drawing_reviews"("revisionId");

-- CreateIndex
CREATE INDEX "customer_drawing_reviews_contactPersonId_idx" ON "customer_drawing_reviews"("contactPersonId");

-- CreateIndex
CREATE INDEX "customer_drawing_reviews_status_idx" ON "customer_drawing_reviews"("status");

-- AddForeignKey
ALTER TABLE "customer_drawing_reviews" ADD CONSTRAINT "customer_drawing_reviews_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "engineering_drawings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_drawing_reviews" ADD CONSTRAINT "customer_drawing_reviews_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "drawing_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_drawing_reviews" ADD CONSTRAINT "customer_drawing_reviews_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "contact_persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_drawing_reviews" ADD CONSTRAINT "customer_drawing_reviews_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_drawing_reviews" ADD CONSTRAINT "customer_drawing_reviews_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_drawing_reviews" ADD CONSTRAINT "customer_drawing_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
