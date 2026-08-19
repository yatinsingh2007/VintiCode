const express = require("express");
const {
  runCode,
  getRunResult,
  submitCode,
  getSubmissionResult,
  getSubmissionsByQuestionId,
  getSubmissionById,
  getLatestSubmission,
  getPlayground,
  savePlayground,
} = require("../controllers/questionController");

const router = express.Router();

router.post("/runCode/:id", runCode);
router.get("/runCode/result/:submissionId", getRunResult);
router.post("/submitCode/:id", submitCode);
router.get("/submission/result/:submissionId", getSubmissionResult);
router.get("/submissions/:id", getSubmissionsByQuestionId);
router.get("/submission/:id", getSubmissionById);
router.get("/latestSubmission/:id", getLatestSubmission);
router.get("/playground/:id", getPlayground);
router.put("/playground/:id", savePlayground);

module.exports = router;
