-- Add revision lifecycle fields to drawing_revisions

ALTER TABLE "drawing_revisions"
ADD COLUMN "fileSize" INTEGER,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectedById" TEXT,
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "status" "DrawingStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "drawing_revisions_status_idx"
ON "drawing_revisions"("status");

ALTER TABLE "drawing_revisions"
ADD CONSTRAINT "drawing_revisions_rejectedById_fkey"
FOREIGN KEY ("rejectedById")
REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;