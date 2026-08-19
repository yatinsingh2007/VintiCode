-- CreateTable
CREATE TABLE "public"."Playground" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "scratchPadId" TEXT,
    "languageId" INTEGER,
    "code" TEXT NOT NULL,

    CONSTRAINT "Playground_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Playground_userId_questionId_key" ON "public"."Playground"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "public"."Playground" ADD CONSTRAINT "Playground_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Playground" ADD CONSTRAINT "Playground_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Playground" ADD CONSTRAINT "Playground_scratchPadId_fkey" FOREIGN KEY ("scratchPadId") REFERENCES "public"."ScratchPad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
