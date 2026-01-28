const express = require("express");
const {
  register,
  login,
  logout,
  verify,
} = require("../controllers/authController");
const { checkUserAuthentication } = require("../middleware/middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", checkUserAuthentication, logout);
router.get("/verify", verify);

module.exports = router;
