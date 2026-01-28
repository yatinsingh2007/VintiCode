const { prisma } = require("../prisma/prismaClient");

const getSubmissions = async (req, res) => {
  try {
    const rawSubmissionData = await prisma.submissions.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        question: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const refinedSubmissionData = rawSubmissionData.map((submission) => {
      return { ...submission, createdAt: submission.createdAt.toISOString() };
    });
    return res.status(200).json(refinedSubmissionData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const getCountOfSubmittedQuestions = async (req, res) => {
  try {
    const data = await prisma.submissions.findMany({
      where: {
        userId: req.user.id,
        status: "accepted",
      },
      distinct: ["questionId"],
      include: {
        question: true,
      },
    });

    let totalData = await prisma.$queryRaw`
    select
      difficulty ,
      count(*) as total_count
    from Questions
    group by difficulty;`;

    totalData = totalData.map((data) => {
      return { ...data, total_count: Number(data.total_count) };
    });

    const respData = data.reduce((acc, curr) => {
      if (acc[curr.question.difficulty]) {
        acc[curr.question.difficulty] += 1;
      } else {
        acc[curr.question.difficulty] = 1;
      }
      return acc;
    }, {});

    return res.status(200).json([...totalData, respData]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const data = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!data) {
      return res.status(404).json({
        error: "user not found",
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

module.exports = {
  getSubmissions,
  getCountOfSubmittedQuestions,
  getUserProfile,
};
