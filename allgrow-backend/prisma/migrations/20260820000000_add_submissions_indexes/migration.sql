-- Index 1: covers getLatestSubmission (userId+questionId filter, createdAt sort)
-- and getSubmissionsByQuestionId (same filter, createdAt sort both directions)
CREATE INDEX "Submissions_userId_questionId_createdAt_idx"
  ON "public"."Submissions" ("userId", "questionId", "createdAt" DESC);

-- Index 2: covers getCountOfSubmittedQuestions (userId+status filter, distinct questionId)
-- and the dashboard home EXISTS subquery (userId+status+questionId — all in-index, no table hit)
CREATE INDEX "Submissions_userId_status_questionId_idx"
  ON "public"."Submissions" ("userId", "status", "questionId");

-- Index 3: covers profile getSubmissions (userId filter, createdAt sort)
-- Index 1 cannot serve this because questionId sits between userId and createdAt
CREATE INDEX "Submissions_userId_createdAt_idx"
  ON "public"."Submissions" ("userId", "createdAt" DESC);
