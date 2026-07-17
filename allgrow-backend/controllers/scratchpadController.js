const { getApproachReview } = require("../services/scratchpadService");

const reviewApproach = async (req, res) => {
  const { questionId, questionTitle, questionDescription, approach } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (!questionId || typeof questionId !== "string" || !questionId.trim()) {
    return res.status(400).json({ error: "questionId is required." });
  }

  if (!questionTitle || typeof questionTitle !== "string" || !questionTitle.trim()) {
    return res.status(400).json({ error: "questionTitle is required." });
  }

  if (!approach || typeof approach !== "string" || !approach.trim()) {
    return res
      .status(400)
      .json({ error: "Your scratch pad is empty. Write something first before reviewing." });
  }

  try {
    const review = await getApproachReview({
      userId,
      questionId: questionId.trim(),
      questionTitle: questionTitle.trim(),
      questionDescription: (questionDescription ?? "").trim(),
      approach: approach.trim(),
    });
    return res.status(200).json(review);
  } catch (err) {
    console.error("[ScratchPad Review]", err.message);
    return res
      .status(500)
      .json({ error: "Failed to analyze your approach. Please try again." });
  }
};

module.exports = { reviewApproach };
