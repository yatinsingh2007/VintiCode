const express = require("express");
const {
  getSubmissions,
  getCountOfSubmittedQuestions,
  getUserProfile,
} = require("../controllers/profileController");

const router = express.Router();

router.get("/submissions", getSubmissions);
router.get("/count-of-submittedQuestions", getCountOfSubmittedQuestions);
router.get("/", getUserProfile);

module.exports = router;
