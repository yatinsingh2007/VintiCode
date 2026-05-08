const { prisma } = require("../prisma/prismaClient");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ─────────────────────────────────────────────
//  ADMIN AUTH
// ─────────────────────────────────────────────

/**
 * POST /api/admin/login
 * Validates ADMIN_EMAIL and ADMIN_PASSWORD from env.
 * Issues a short-lived (8h) admin-scoped JWT cookie.
 */
const adminLogin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: "Invalid admin credentials." });
  }

  const token = jwt.sign(
    { isAdmin: true, email },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res
    .cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    })
    .status(200)
    .json({ message: "Admin login successful." });
};

/**
 * POST /api/admin/logout
 */
const adminLogout = (req, res) => {
  return res
    .cookie("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    })
    .status(200)
    .json({ message: "Admin logout successful." });
};

/**
 * GET /api/admin/verify
 * Returns { authenticated: true } if the admin cookie is valid.
 */
const adminVerify = (req, res) => {
  // If we reach here the checkAdminAuthentication middleware passed
  return res.status(200).json({ authenticated: true, email: req.admin.email });
};

// ─────────────────────────────────────────────
//  DASHBOARD STATS
// ─────────────────────────────────────────────

/**
 * GET /api/admin/dashboard
 * Returns platform-wide counts and recent activity.
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalQuestions,
      totalSubmissions,
      acceptedSubmissions,
      rejectedSubmissions,
      recentSubmissions,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.questions.count(),
      prisma.submissions.count(),
      prisma.submissions.count({ where: { status: "accepted" } }),
      prisma.submissions.count({ where: { status: "rejected" } }),
      prisma.submissions.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          question: { select: { id: true, title: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

    return res.status(200).json({
      stats: {
        totalUsers,
        totalQuestions,
        totalSubmissions,
        acceptedSubmissions,
        rejectedSubmissions,
      },
      recentSubmissions,
      recentUsers,
    });
  } catch (err) {
    console.error("Admin getDashboardStats Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
//  QUESTION MANAGEMENT
// ─────────────────────────────────────────────

/**
 * GET /api/admin/questions
 * Lists all questions with pagination and optional search.
 */
const getAllQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { difficulty: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [questions, total] = await Promise.all([
      prisma.questions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          difficulty: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { solvedQuestions: true } },
        },
      }),
      prisma.questions.count({ where }),
    ]);

    return res.status(200).json({
      questions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Admin getAllQuestions Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * GET /api/admin/questions/:id
 * Returns a single question with full test_cases included.
 */
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await prisma.questions.findUnique({ where: { id } });
    if (!question) {
      return res.status(404).json({ error: "Question not found." });
    }
    return res.status(200).json(question);
  } catch (err) {
    console.error("Admin getQuestionById Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * POST /api/admin/questions
 * Creates a new question. Maps directly to the Questions prisma model.
 *
 * Body fields (matching schema.prisma Questions model):
 *   title, description, input_format, output_format,
 *   sample_input, sample_output, difficulty, test_cases (JSON array)
 */
const createQuestion = async (req, res) => {
  try {
    const {
      title,
      description,
      input_format,
      output_format,
      sample_input,
      sample_output,
      difficulty,
      test_cases,
    } = req.body;

    // Required field validation
    const required = {
      title,
      description,
      input_format,
      output_format,
      sample_input,
      sample_output,
      difficulty,
    };
    const missing = Object.entries(required)
      .filter(([, v]) => !v || String(v).trim() === "")
      .map(([k]) => k);

    if (missing.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    if (!Array.isArray(test_cases) || test_cases.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one test case is required." });
    }

    // Validate each test case has minimum required fields
    for (let i = 0; i < test_cases.length; i++) {
      const tc = test_cases[i];
      if (!tc.input || !tc.output) {
        return res.status(400).json({
          error: `Test case at index ${i} must have 'input' and 'output' fields.`,
        });
      }
    }

    const question = await prisma.questions.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        input_format: input_format.trim(),
        output_format: output_format.trim(),
        sample_input: sample_input.trim(),
        sample_output: sample_output.trim(),
        difficulty: difficulty.trim(),
        test_cases,
      },
    });

    return res.status(201).json({ message: "Question created.", question });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A question with this title already exists." });
    }
    console.error("Admin createQuestion Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * PUT /api/admin/questions/:id
 * Fully updates a question.
 */
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      input_format,
      output_format,
      sample_input,
      sample_output,
      difficulty,
      test_cases,
    } = req.body;

    const existing = await prisma.questions.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Question not found." });
    }

    if (Array.isArray(test_cases) && test_cases.length > 0) {
      for (let i = 0; i < test_cases.length; i++) {
        const tc = test_cases[i];
        if (!tc.input || !tc.output) {
          return res.status(400).json({
            error: `Test case at index ${i} must have 'input' and 'output' fields.`,
          });
        }
      }
    }

    const updated = await prisma.questions.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description && { description: description.trim() }),
        ...(input_format && { input_format: input_format.trim() }),
        ...(output_format && { output_format: output_format.trim() }),
        ...(sample_input && { sample_input: sample_input.trim() }),
        ...(sample_output && { sample_output: sample_output.trim() }),
        ...(difficulty && { difficulty: difficulty.trim() }),
        ...(test_cases && { test_cases }),
      },
    });

    return res.status(200).json({ message: "Question updated.", question: updated });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A question with this title already exists." });
    }
    console.error("Admin updateQuestion Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * DELETE /api/admin/questions/:id
 * Deletes a question and cascades submission deletions.
 */
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.questions.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Question not found." });
    }

    // Delete linked submissions first to avoid FK constraint errors
    await prisma.submissions.deleteMany({ where: { questionId: id } });
    await prisma.questions.delete({ where: { id } });

    return res.status(200).json({ message: "Question and its submissions deleted." });
  } catch (err) {
    console.error("Admin deleteQuestion Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
//  USER MANAGEMENT
// ─────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Lists all users with pagination and optional search.
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: { select: { solvedQuestions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Admin getAllUsers Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * GET /api/admin/users/:id
 * Returns a single user with their submission history.
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        solvedQuestions: {
          orderBy: { createdAt: "desc" },
          include: {
            question: { select: { id: true, title: true, difficulty: true } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("Admin getUserById Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
//  SUBMISSION MANAGEMENT
// ─────────────────────────────────────────────

/**
 * GET /api/admin/submissions
 * Lists all submissions with pagination, language/status filters.
 */
const getAllSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, language, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (language) where.languageId = parseInt(language);
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { question: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.submissions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          question: { select: { id: true, title: true, difficulty: true } },
        },
      }),
      prisma.submissions.count({ where }),
    ]);

    return res.status(200).json({
      submissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Admin getAllSubmissions Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * GET /api/admin/submissions/:id
 * Returns a single submission with full code.
 */
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submissions.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        question: { select: { id: true, title: true, difficulty: true } },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found." });
    }

    return res.status(200).json(submission);
  } catch (err) {
    console.error("Admin getSubmissionById Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  adminVerify,
  getDashboardStats,
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAllUsers,
  getUserById,
  getAllSubmissions,
  getSubmissionById,
};
