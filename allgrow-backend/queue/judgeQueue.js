require('dotenv').config();
const { Queue } = require("bullmq");
const ioredis = require("ioredis");

const connection = new ioredis(process.env.REDIS_URL);

const judgeQueue = new Queue("judgeQueue" , { 
    connection , 
    defaultJobOptions :  {
        attempts : 2 ,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true
    }});

module.exports = { connection , judgeQueue }