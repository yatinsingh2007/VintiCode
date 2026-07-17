const express = require("express");
const { reviewApproach } = require("../controllers/scratchpadController");

const router = express.Router();

router.post("/review", reviewApproach);

module.exports = router;
