-- AlterTable
ALTER TABLE "public"."Submissions" ADD COLUMN     "scratchpadId" TEXT;

-- CreateTable
CREATE TABLE "public"."ScratchPad" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScratchPad_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Submissions" ADD CONSTRAINT "Submissions_scratchpadId_fkey" FOREIGN KEY ("scratchpadId") REFERENCES "public"."ScratchPad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScratchPad" ADD CONSTRAINT "ScratchPad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScratchPad" ADD CONSTRAINT "ScratchPad_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
