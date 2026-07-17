const { prisma } = require("../prisma/prismaClient");
const { reviewApproach } = require("./geminiService");

const getApproachReview = async ({ userId, questionId, questionTitle, questionDescription, approach }) => {
  const aiResult = await reviewApproach(questionTitle, questionDescription, approach);

  // Map AI status to DB enum: READY → accepted, THINK_MORE → rejected
  const dbStatus = aiResult.status === "READY" ? "accepted" : "rejected";

  const record = await prisma.scratchPad.create({
    data: {
      userId,
      questionId,
      status: dbStatus,
      explanation: approach,
    },
  });

  return { ...aiResult, scratchpadId: record.id };
};

module.exports = { getApproachReview };
