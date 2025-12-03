require('dotenv').config()
const axios = require('axios');

const api = axios.create({
    baseURL : `${process.env.JUDGE0_API}`,
    timeout : 10000
})

module.exports = { api }