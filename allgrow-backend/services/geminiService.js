const axios = require("axios");

const GEMINI_API_URL = process.env.GEMINI_API_URL;

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

Respond with ONLY valid JSON — no markdown, no code blocks, no extra text:

If the student has enough understanding to begin:
{"status":"READY","summary":"2-4 encouraging sentences","suggestions":["hint","hint"]}

If the student needs more planning:
{"status":"THINK_MORE","summary":"2-4 supportive sentences encouraging more planning","suggestions":["hint","hint","hint"]}
`.trim();

const reviewApproach = async (questionTitle, questionDescription, approach) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = buildPrompt(questionTitle, questionDescription, approach);

  const response = await axios.post(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
      },
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
    },
  );

  const rawText =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  if (!["READY", "THINK_MORE"].includes(parsed.status)) {
    throw new Error("Unexpected status value in Gemini response.");
  }

  return {
    status: parsed.status,
    summary: String(parsed.summary || "").trim(),
    suggestions: (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
      .slice(0, 3)
      .map(String),
  };
};

module.exports = { reviewApproach };
