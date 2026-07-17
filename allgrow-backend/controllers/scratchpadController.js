const axios = require("axios");
const { prisma } = require("../prisma/prismaClient");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const buildPrompt = (questionTitle, questionDescription, approach) => `
You are a supportive software engineering mentor helping students practice for technical interviews.

Your task is to evaluate whether a student has enough understanding to begin implementing a solution.
Do NOT evaluate grammar, writing quality, fluency, or sentence structure.
Many students use bullet points, pseudocode, short notes, or write in imperfect English — all of this is acceptable.

---

PROBLEM:
Title: ${questionTitle}
Description: ${questionDescription}

---

STUDENT'S APPROACH/NOTES:
"${approach}"

---

EVALUATION RULES:
- Evaluate technical direction, NOT writing ability
- Be intentionally forgiving — if any reasonable direction is shown, lean toward READY
- Only return THINK_MORE if the approach is completely empty, incoherent, or shows zero direction
- Never reveal the algorithm, the answer, or a solution path in suggestions
- Suggestions must be gentle hints only: edge cases, complexity, data structures, input constraints

TONE:
- Always encouraging and supportive
- Use phrases like "you're heading in the right direction", "you have enough to start", "consider thinking about"
- Never use: "wrong", "incorrect", "bad", "you don't understand"

---

You MUST respond with ONLY valid JSON — no markdown, no code blocks, no extra text.

If the student has enough understanding to begin:
{"status":"READY","summary":"2-4 encouraging sentences","suggestions":["hint","hint"]}

If the student needs more planning:
{"status":"THINK_MORE","summary":"2-4 supportive sentences encouraging more planning","suggestions":["hint","hint","hint"]}
`.trim();

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

  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    return res.status(500).json({ error: "AI review is not configured on the server." });
  }

  try {
    const prompt = buildPrompt(
      questionTitle.trim(),
      (questionDescription ?? "").trim(),
      approach.trim(),
    );

    const groqResponse = await axios.post(
      GROQ_URL,
      {
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 512,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        timeout: 20000,
      },
    );

    const rawText = groqResponse.data?.choices?.[0]?.message?.content ?? "";

    const cleaned = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!["READY", "THINK_MORE"].includes(parsed.status)) {
      throw new Error("Unexpected status value in AI response.");
    }

    const aiResult = {
      status: parsed.status,
      summary: String(parsed.summary || "").trim(),
      suggestions: (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
        .slice(0, 3)
        .map(String),
    };

    const dbStatus = aiResult.status === "READY" ? "accepted" : "rejected";

    const record = await prisma.scratchPad.create({
      data: {
        userId,
        questionId: questionId.trim(),
        status: dbStatus,
        explanation: approach.trim(),
        aiSummary: aiResult.summary,
        aiSuggestions: aiResult.suggestions,
      },
    });

    return res.status(200).json({ ...aiResult, scratchpadId: record.id });
  } catch (err) {
    console.error("[ScratchPad Review] message:", err.message);
    console.error("[ScratchPad Review] ai error:", err.response?.data ?? "no response body");
    return res
      .status(500)
      .json({ error: "Failed to analyze your approach. Please try again." });
  }
};

module.exports = { reviewApproach };
