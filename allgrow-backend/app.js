require("dotenv").config();
const { prisma } = require("./prisma/prismaClient");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const { checkUserAuthentication } = require("./middleware/middleware");

const authRouter = require("./routes/auth");
const dashboardRouter = require("./routes/dashboard");
const questionsRouter = require("./routes/questions");
const profileRouter = require("./routes/profile");
const { runSubmission } = require("./controllers/runSubmission");

const app = express();
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.post("/api/run-submission/:submissionId", runSubmission);

app.use("/api/auth", authRouter);
app.use("/api/dashboard", checkUserAuthentication, dashboardRouter);
app.use("/api/questions", checkUserAuthentication, questionsRouter);
app.use("/api/userprofile", checkUserAuthentication, profileRouter);

app.get("/api", checkUserAuthentication, (req, res) => {
  return res.status(200).json({ message: "Welcome back to VintiCode API." });
});

app.get("/", (req, res) => {
  return res.send("VintiCode Backend is running.");
});

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

module.exports = app;

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running locally on port ${PORT}`);
    });
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
  }
}

main();
