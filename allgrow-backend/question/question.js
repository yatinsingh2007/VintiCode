require("dotenv").config();

const express = require("express");
const { prisma } = require("../prisma/prismaClient");
const { api } = require("../utils");
const { redis } = require("../redis/redis");

const question = express.Router();

question.post("/runCode/:id", async (req, res) => {
  const randomInt = Math.floor(Math.random() * 5) + 1;
  const { v4: uuidv4 } = await import("uuid");

  const { code, language_id, input } = req.body;
  const { id: questionId } = req.params;
  const submissionId = uuidv4();

  try {
    await redis.set(
      `submission:${submissionId}`,
      JSON.stringify({
        status: "processing",
        questionId,
      }),
      "EX",
      300
    );

    const submitRes = await api.post(
      "/submissions?base64_encoded=false&wait=false",
      {
        source_code: code,
        language_id,
        stdin: input || "",
        cpu_time_limit: 2,
        wall_time_limit: 4,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Host": JSON.parse(process.env[`USER_${randomInt}`])[
            "x-rapidapi-host"
          ],
          "X-RapidAPI-Key": JSON.parse(process.env[`USER_${randomInt}`])[
            "x-rapidapi-key"
          ],
        },
      }
    );

    const token = submitRes.data.token;

    const MAX_POLLS = 15;
    let polls = 0;
    let result;

    while (true) {
      await new Promise((r) => setTimeout(r, 1200));

      const pollRes = await api.get(
        `/submissions/${token}?base64_encoded=false`,
        {
          headers: {
            "X-RapidAPI-Host": JSON.parse(process.env[`USER_${randomInt}`])[
              "x-rapidapi-host"
            ],
            "X-RapidAPI-Key": JSON.parse(process.env[`USER_${randomInt}`])[
              "x-rapidapi-key"
            ],
          },
        }
      );

      const statusId = pollRes.data.status.id;

      if (statusId <= 2) {
        polls++;
        if (polls >= MAX_POLLS) {
          return res.status(200).json({
            result: {
              status: "TLE",
              stdout: "",
              stderr: "Time Limit Exceeded",
            },
          });
        }
        continue;
      }

      if (statusId === 5) {
        return res.status(400).json({
          result: {
            status: "TLE",
            stdout: "",
            stderr: "Time Limit Exceeded",
          },
        });
      }

      result = pollRes.data;
      if (result.stdout.length > 3000) {
        result.stdout = result.stdout.slice(0, 3000) + "\n\n[Output truncated: too large]";
      }
      break;
    }

    await redis.set(
      `submission:${submissionId}`,
      JSON.stringify({
        status: "completed",
        result,
      }),
      "EX",
      600
    );

    return res.status(200).json({ submissionId });
  } catch (err) {
    console.error("Run Error:", err?.response?.data || err.message);

    await redis.set(
      `submission:${submissionId}`,
      JSON.stringify({
        status: "failed",
        result: {
          status: "failed",
          stdout: "",
          stderr: "Internal Server Error",
        },
      }),
      "EX",
      300
    );

    return res.status(500).json({ error: "Internal Server Error" });
  }
});

question.get("/runCode/result/:submissionId", async (req, res) => {
  const { submissionId } = req.params;

  const data = await redis.get(`submission:${submissionId}`);

  if (!data) {
    return res.status(404).json({ status: "not_found" });
  }

  return res.status(200).json(JSON.parse(data));
});


question.post("/submitCode/:id", async (req, res) => {
  const { v4: uuidv4 } = await import("uuid");
  const submissionId = uuidv4();

  const userId = req.user.id;
  const { code, language_id } = req.body;
  const { id } = req.params;

  try {
    const questionData = await prisma.questions.findUnique({
      where: { id },
    });

    if (!questionData) {
      return res.status(404).json({ error: "Question Not Found" });
    }

    const testCases = questionData.test_cases;

    await redis.set(
      `submissions:${submissionId}`,
      JSON.stringify({
        status: "queued",
        questionId: id,
        code,
        language_id,
        testCases,
        userId,
      }),
      "EX",
      1800
    );

    fetch(
      `${process.env.BACKEND_URL}/api/run-submission/${submissionId}`,
      { method: "POST" }
    ).catch(console.error);

    return res.status(200).json({
      submissionId,
      status: "queued",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

question.get("/submission/result/:submissionId", async (req, res) => {
  const { submissionId } = req.params;

  const data = await redis.get(`submissions:${submissionId}`);

  if (!data) {
    return res.status(404).json({ status: "not_found" });
  }

  return res.status(200).json(JSON.parse(data));
});

question.get("/submissions/:id", async (req, res) => {
  try {
    const ourUser = req.user;
    const { id } = req.params;

    const data = await prisma.submissions.findMany({
      where: {
        userId: ourUser.id,
        questionId: id,
      },
      include: { question: true },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ submissions: data });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

question.get("/submission/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const submissionData = await prisma.submissions.findUnique({
      where: { id },
    });

    return res.status(200).json(submissionData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

question.get("/latestSubmission/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const latestSubmission = await prisma.submissions.findFirst({
      where: {
        userId: req.user.id,
        questionId: id,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestSubmission) {
      return res.status(404).json({ error: "Submission not Found" });
    }

    return res.status(200).json(latestSubmission);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = { question };