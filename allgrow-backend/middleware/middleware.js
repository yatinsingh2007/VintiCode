const { prisma } = require('../prisma/prismaClient');

const jwt = require('jsonwebtoken');
require('dotenv').config();

const checkUserAuthentication = async (req , res , next) => {
    const { token } = req.cookies;
    if (!token){
        return res.status(401).json({
            "error" : "User Anauthorized"
        })
    }
    console.log("Middleware Token: " , token);

    try {
        const decoded = jwt.verify(token , process.env.JWT_SECRET);
        const ourUser = await prisma.user.findUnique({
            where : {
                id : decoded.id
            }
        });
        if (!ourUser){
            return res.status(401).json(
                { error: "User not found" }
            );
        }
        req.user = ourUser;
        next();
    }catch(err){
        console.log(err);
        return res.status(500).json(
            { error: "Internal Server Error" }
        )
    }
}

module.exports = { checkUserAuthentication }