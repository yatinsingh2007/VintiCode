const express = require("express");
const { checkAdminAuthentication } = require("../middleware/adminAuth");
const {
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
} = require("../controllers/adminController");

const router = express.Router();

// ── Auth (public) ──────────────────────────────────
router.post("/login", adminLogin);
router.post("/logout", adminLogout);
router.get("/verify", checkAdminAuthentication, adminVerify);

// ── Dashboard ─────────────────────────────────────
router.get("/dashboard", checkAdminAuthentication, getDashboardStats);

// ── Questions ─────────────────────────────────────
router.get("/questions", checkAdminAuthentication, getAllQuestions);
router.get("/questions/:id", checkAdminAuthentication, getQuestionById);
router.post("/questions", checkAdminAuthentication, createQuestion);
router.put("/questions/:id", checkAdminAuthentication, updateQuestion);
router.delete("/questions/:id", checkAdminAuthentication, deleteQuestion);

// ── Users ─────────────────────────────────────────
router.get("/users", checkAdminAuthentication, getAllUsers);
router.get("/users/:id", checkAdminAuthentication, getUserById);

// ── Submissions ───────────────────────────────────
router.get("/submissions", checkAdminAuthentication, getAllSubmissions);
router.get("/submissions/:id", checkAdminAuthentication, getSubmissionById);

module.exports = router;
