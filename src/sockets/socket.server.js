const { Server } = require("socket.io");
const cookie=require('cookie');
const jwt=require('jsonwebtoken');
const UserModel=require('../model/user.model');
const aiService=require('../services/ai.service');
const messageModel = require('../model/message.model');

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
    console.log("Parsed AI Message payload:", msgPayload.chat, msgPayload.content);
    await messageModel.create({
      chat:msgPayload.chat,
      user:socket.user._id,
      content:msgPayload.content,
      role:msgPayload.role
    })
      const chatHistory=await messageModel.find({
         chat:msgPayload.chat
      })
     

      const response=await aiService.generateResponse(chatHistory.map(item=>{
         return {
            role:item.role,
            parts:[{text:item.content}]
         }
      }))

      await messageModel.create({
         chat:msgPayload.chat,
         user:socket.user._id,
         content:response,
         role:'model'
      })
      socket.emit("ai-response",{
         content:response,
         chat:msgPayload.chat
      });

      });


   });


}


module.exports = initSocketServer