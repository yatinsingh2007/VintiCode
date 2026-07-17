const { Redis } = require("ioredis");

let redisInstance;

function getRedis() {
  if (!redisInstance) {
    redisInstance = new Redis(`${process.env.REDIS_URL}`);
  }
  return redisInstance;
}

module.exports = { getRedis };