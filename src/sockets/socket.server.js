const { Server } = require("socket.io");
const cookie=require('cookie');
const jwt=require('jsonwebtoken');
const UserModel=require('../model/user.model');
const aiService=require('../services/ai.service');
function initSocketServer(httpServer) {

   const io = new Server(httpServer, {})

   io.use(async(socket, next) => {

         const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
         if (!cookies.token) {
           return next(new Error("Authentication error"));
         }

      try{
        const decoded=jwt.verify(cookies.token,process.env.JWT_SECRET);
        const user=await UserModel.findById(decoded.id);
        socket.user=user;
         next();
      }
      catch(err){
          return next(new Error("Authentication error"));
      }

      
   });


   io.on("connection", (socket) => {

      socket.on("ai-message",async(msgPayload)=>{
      console.log("AI Message received:",msgPayload);
      
      if (typeof msgPayload === "string") {
      msgPayload = JSON.parse(msgPayload);
    } 
      const response=await aiService.generateResponse(msgPayload.content)
      socket.emit("ai-response",{
         content:response,
         chat:msgPayload.chat
      });

      });


   });


}


module.exports = initSocketServer