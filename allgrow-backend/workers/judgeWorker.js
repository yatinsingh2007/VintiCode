require('dotenv').config();
const { Worker } = require("bullmq");
const { api } = require("../utils");
const { connection , judgeQueue } = require("../queue/judgeQueue");

const randomInt = Math.floor(Math.random() * 5) + 1;
const headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Host": JSON.parse(process.env[`USER_${randomInt}`])['x-rapidapi-host'],
    "X-RapidAPI-Key": JSON.parse(process.env[`USER_${randomInt}`])['x-rapidapi-key']
}

async function runSingleTestcase({source_code , language_id , input , expected_output}){
    try{
        const response = await api.post(`${process.env.JUDGE0_API}` , {
            source_code : source_code,
            language_id : language_id,
            stdin : input ? input : "",
            expected_output : expected_output ,
            cpu_time_limit: 2,
            wall_time_limit: 4
        } , {
            headers : headers
        })
        const result = response.data;
        return result;
    }catch(err){
        console.log(err);
        return err;
    }
}

