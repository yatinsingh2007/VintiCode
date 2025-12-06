const express = require("express");

const validator = require("validator");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const { prisma } = require("../prisma/prismaClient");
const { checkUserAuthentication } = require("../middleware/middleware");

require("dotenv").config();

const auth = express.Router();

auth.use(express.json());

auth.post("/register", async (req, res) => {
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  name = name.trim();
  email = email.trim();
  password = password.trim();
  if (name.length < 3) {
    return res
      .status(400)
      .json({ error: "Name must be at least 3 characters long" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(400).json({ error: "Password is not strong enough" });
  }

  password = await bcrypt.hash(password, 10);
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });
    return res.status(201).send("User registered successfully");
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

auth.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const ourUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!ourUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const compare = await bcrypt.compare(password, ourUser.password);
    if (!compare) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: ourUser.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      })
      .status(200)
      .json({
        message: "Login successful",
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

auth.get("/logout", checkUserAuthentication, (req, res) => {
  res.cookie("token" , null , {
    expires : new Date(Date.now())
  }).status(200).json({
    message: "Logout successful",
  });
});

auth.get("/verify", async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(200).json({
        authenticated: false,
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ourUser = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });
    if (!ourUser) {
      return res.status(200).json({
        authenticated: false,
      });
    }
    return res.status(200).json({
      authenticated: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

module.exports = { auth };
