require('dotenv').config();
const { prisma } = require('./prisma/prismaClient');
const cors = require('cors');
const { dashboard } = require('./dashboard/dashboard');
const cookieParser = require('cookie-parser');
const express = require('express');
const { auth } = require('./auth/auth');
const { question } = require('./question/question');
const { checkUserAuthentication } = require('./middleware/middleware');
const { profile } = require('./profile/profile');

const app = express();
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

app.use(cors({
  origin: `${process.env.FRONTEND_URL}`,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', auth);
app.use('/api/dashboard', checkUserAuthentication, dashboard);
app.use('/api/questions', checkUserAuthentication, question);
app.use('/api/userprofile', checkUserAuthentication, profile);


app.get('/api', (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return res.status(200).json({ message: 'Welcome back to VintiCode API.' });
});

app.get('/', (req, res) => {
  return res.send('VintiCode Backend is running.');
});

app.use((req , res) => {
  return res.status(404).json({ message: 'Route not found' });
})


module.exports = app;


async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to the database');
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