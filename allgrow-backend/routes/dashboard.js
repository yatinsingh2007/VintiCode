const express = require("express");
const {
  getHome,
  getQuestionById,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/home", getHome);
router.get("/question/:id", getQuestionById);

module.exports = router;
