require("dotenv").config();
const { prisma } = require("../prisma/prismaClient");
const { api } = require("../utils");
const { redis } = require("../redis/redis");

async function startWorker() {
  console.log("✅ Submission Worker Started...");

  while (true) {
    try {
      const data = await redis.brpop("queue:submissions", 0);
      const submissionId = data[1];

      console.log("📥 Pulled from queue:", submissionId);

      const raw = await redis.get(`submissions:${submissionId}`);
      if (!raw) {
        console.log("⚠️ Submission not found in Redis:", submissionId);
        continue;
      }

      const submission = JSON.parse(raw);

      const {
        code,
        language_id,
        testCases,
        questionId,
        userId,
      } = submission;

      await redis.set(
        `submissions:${submissionId}`,
        JSON.stringify({
          ...submission,
          status: "processing",
        }),
        "EX",
        1800
      );

      const randomInt = Math.floor(Math.random() * 5) + 1;
      const userEnv = JSON.parse(process.env[`USER_${randomInt}`]);

      let finalVerdict = "accepted";
      let report = [];

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];

        const submitRes = await api.post(
          "/submissions?base64_encoded=false&wait=false",
          {
            source_code: code,
            language_id,
            stdin: tc.input,
            cpu_time_limit: 2,
            wall_time_limit: 4,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Host": userEnv["x-rapidapi-host"],
              "X-RapidAPI-Key": userEnv["x-rapidapi-key"],
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
                "X-RapidAPI-Host": userEnv["x-rapidapi-host"],
                "X-RapidAPI-Key": userEnv["x-rapidapi-key"],
              },
            }
          );

          const statusId = pollRes.data.status.id;

          if (statusId <= 2) {
            polls++;
            if (polls >= MAX_POLLS) {
              result = { status: "TLE" };
              finalVerdict = "TLE";
              break;
            }
            continue;
          }

          if (statusId === 5) {
            result = { status: "TLE" };
            finalVerdict = "TLE";
            break;
          }

          result = pollRes.data;
          break;
        }

        const userOutput = (result?.stdout || "").trim();
        const expected = tc.output.trim();

        let caseVerdict = "AC";

        if (finalVerdict === "TLE") {
          caseVerdict = "TLE";
        } else if (userOutput !== expected) {
          caseVerdict = "WA";
          finalVerdict = "rejected";
        }

        report.push({
          testcase: i + 1,
          verdict: caseVerdict,
          input: tc.input,
          output: userOutput,
          expected: expected,
        });

        if (finalVerdict !== "accepted") break;
      }

      await redis.set(
        `submissions:${submissionId}`,
        JSON.stringify({
          status: "completed",
          result: {
            verdict: finalVerdict,
            report: report,
          },
        }),
        "EX",
        1800
      );

      console.log("Submission Completed:", submissionId);

      // ✅ Save to DB
      await prisma.$transaction(async (tx) => {
        await tx.submissions.create({
          data: {
            userId: userId,
            questionId: questionId,
            status: finalVerdict,
            languageId: language_id,
            code: code,
            report: JSON.stringify(report),
          },
        });
      });

      if (finalVerdict === "accepted") {
        await prisma.solvedQuestions.create({
          data: {
            userId,
            questionId,
            status: "accepted",
            code,
            languageId: language_id,
          },
        });
      }

    } catch (err) {
      console.error("Worker Error:", err);
    }
  }
}

startWorker();