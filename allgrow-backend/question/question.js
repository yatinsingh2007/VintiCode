require("dotenv").config();

const express = require("express");

const { prisma } = require("../prisma/prismaClient");

const question = express.Router();

const { api } = require("../utils");

const { judgeQueue } = require("../queue/judgeQueue");

const { redis } = require("../redis/redis");


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
        questionId: questionId,
      }),
      "EX",
      300
    );
    const submitRes = await api.post(
      `/submissions/?base64_encoded=false&wait=false`,
      {
        source_code: code,
        language_id: language_id,
        stdin: input ? input : "",
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
      break;
    }

    await redis.set(`submission:${submissionId}` , JSON.stringify({
      status : "completed",
      result : result
    }) , "EX" , 600)

    return res.status(200).json({ submissionId });

  } catch (err) {
    console.error("Run Error:", err?.response?.data || err.message);
    await redis.set(`submission:${submissionId}` , JSON.stringify({
      status : "failed",
      result : {
        status : "failed",
        stdout : "",
        stderr : "Internal Server Error"
      }
    }) , "EX" , 300)
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

question.get("/runCode/result/:submissionId", async (req, res) => {
  const submissionId = req.params.submissionId;

  const data = await redis.get(`submission:${submissionId}`);

  if (!data) {
    return res.status(404).json({ status: "not_found" });
  }

  return res.status(200).json(JSON.parse(data));
});

question.post("/submitCode/:id", async (req, res) => {
  const { code, language_id } = req.body;
  const { id } = req.params;
  const randomInt = Math.floor(Math.random() * 5) + 1;
  try {
    const questionData = await prisma.questions.findUnique({
      where: {
        id: id,
      },
    });
    if (!questionData) {
      return res.status(404).json({
        error: "Question Not Found",
      });
    }
    const testCases = questionData.test_cases;
    const job = await judgeQueue.add("submit", {
      code,
      language_id,
      testCases,
    });
    const response = Promise.all(
      testCases.map(async (testCase) => {
        try {
          const res = await api.post(
            `${process.env.JUDGE0_API}`,
            {
              source_code: code,
              language_id: language_id,
              stdin: testCase.input,
              expected_output: testCase.output,
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
          return res.data;
        } catch (err) {
          console.log(err);
          return res.status(500).json({
            message: "Submission Failed",
          });
        }
      })
    );

    const results = await response;

    const resultSummary = results.map((result) => {
      return result.status.description;
    });

    for (let status of resultSummary) {
      if (status !== "Accepted") {
        await prisma.$transaction(async (tx) => {
          await tx.submissions.create({
            data: {
              userId: req.user.id,
              questionId: id,
              status: `rejected`,
              languageId: language_id,
              code: code,
            },
          });
        });
        return res.status(400).json({
          message: "Some Test Cases Failed",
          results: resultSummary,
        });
      }
    }
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          solvedQuestions: {
            create: {
              questionId: id,
              status: "accepted",
              code: code,
              languageId: language_id,
            },
          },
        },
      });
    });
    return res.status(200).json({
      message: "All Test Cases Passed",
      results: resultSummary,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
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
      include: {
        question: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return res.status(200).json({
      submissions: data,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

question.get("/submission/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const submissionData = await prisma.submissions.findUnique({
      where: {
        id: id,
      },
    });
    return res.status(200).json(submissionData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
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
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!latestSubmission)
      return res.status(404).json({
        error: "Submission not Found",
      });
    return res.status(200).json(latestSubmission);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

module.exports = { question };
