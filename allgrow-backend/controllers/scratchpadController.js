const axios = require("axios");
const { prisma } = require("../prisma/prismaClient");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const buildPrompt = (questionTitle, questionDescription, approach) => `
You are a supportive but honest software engineering mentor. A student is preparing to solve a coding problem and has written notes in a scratch pad. Your job is to decide whether they have thought about it enough to start coding — and give them useful, honest feedback either way.

---

PROBLEM:
Title: ${questionTitle}
Description: ${questionDescription}

---

STUDENT'S SCRATCH PAD:
"${approach}"

---

STEP 1 — IS THIS A REAL ATTEMPT?

First, check whether the student's text is actually an attempt to think about the problem. The following are NOT real attempts — handle them separately:

A. JUNK / GIBBERISH
   Random characters (asdfgh, qwerty, 12345), repeated letters (aaaa), lone punctuation (!!!, ???), single unrelated words (hi, test, ok), or keyboard mashing.
   → Return THINK_MORE. Summary: tell them honestly and kindly that this doesn't look like an approach. Ask them to write their actual thinking about the problem. Do NOT generate fake technical hints.

B. PLACEHOLDER OR SURRENDER
   "idk", "I don't know", "not sure", "I'll figure it out", "TODO", "write here", or just "I give up".
   → Return THINK_MORE. Summary: acknowledge that starting is hard, encourage them to write even one sentence about what they think the problem is asking. Do NOT generate technical hints.

C. EMOTIONAL / OFF-TOPIC
   Personal feelings ("this is hard", "I hate this"), questions directed at the AI ("can you help me?", "give me a hint"), or text about a completely different topic.
   → Return THINK_MORE. Summary: gently redirect them to thinking about the problem itself. For help-requests, remind them this space is for their own thinking, not for getting answers. Do NOT generate technical hints.

D. COPY-PASTED PROBLEM STATEMENT
   The student has repeated the problem description word-for-word or nearly word-for-word.
   → Return THINK_MORE. Summary: note that this looks like the problem description rather than their own approach. Ask them: how would YOU go about solving it? Do NOT generate technical hints.

E. CODE INSTEAD OF PLAN
   The student submitted actual code (Python, Java, C++, JavaScript syntax) instead of a written plan.
   → Return THINK_MORE. Summary: the scratch pad is for planning, not coding. Ask them to describe in words what their code is doing — that explanation IS their approach. Keep suggestions code-free.

F. ASKING FOR THE ANSWER
   The student wrote something like "just tell me the answer", "what's the solution", or clearly embedded a request for the algorithm.
   → Return THINK_MORE. Summary: explain that this space is for their own thinking, and that figuring out the direction themselves is the whole point. Encourage them to write what they already know about the problem.

---

STEP 2 — IF IT IS A REAL ATTEMPT, EVALUATE IT

Accept any of these as a real attempt: bullet points, pseudocode, numbered steps, short phrases, imperfect English, Hinglish, or any other language. Do NOT penalise grammar, spelling, or writing quality.

Now decide:

READY — return this if the student has shown enough technical direction to start coding. Lean generous: if there is any reasonable algorithmic direction, return READY.
Examples of READY:
  - "two pointers from both ends" for a two-sum style problem
  - "use a hashmap to track frequency" with a vague but plausible plan
  - A brute-force O(n²) plan that would actually work (suboptimal is fine — they can optimise while coding)
  - Pseudocode that captures the main loop, even if rough
  - A short but correct idea like "BFS level by level"

THINK_MORE — return this only when:
  - The approach is too vague to start coding ("use a loop" with no idea of what to loop over or why)
  - The student mentions a data structure or technique with zero connection to the problem
  - The direction is fundamentally incompatible with the problem constraints (e.g. proposing to sort an infinite stream)
  - The approach only solves an example case and shows no generalisation

IMPORTANT — for real attempts, NEVER say the approach is wrong. Say things like "you're heading in a good direction" or "you have enough to start". Suggestions must be gentle nudges only: think about input constraints, edge cases, time/space complexity, or a data structure to consider. NEVER reveal the algorithm or the answer.

---

STEP 3 — RESPOND

Language: always respond in English regardless of what language the student wrote in.

Tone rules:
- Always warm, encouraging, and respectful
- For junk/non-attempts: honest but kind — never sarcastic or dismissive
- Never use the words: wrong, incorrect, bad, terrible, nonsense, garbage, invalid
- For real attempts: always affirm what they got right before suggesting more

You MUST respond with ONLY valid JSON — no markdown fences, no prose, no extra text:

{"status":"READY","summary":"2-4 sentences","suggestions":["up to 3 short hints"]}
or
{"status":"THINK_MORE","summary":"2-4 sentences","suggestions":["up to 3 short redirects or hints"]}
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
