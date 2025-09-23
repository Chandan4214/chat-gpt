const { Server } = require("socket.io");
const cookie=require('cookie');
const jwt=require('jsonwebtoken');
const UserModel=require('../model/user.model');

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
      console.log("A user connected:", socket.id);
   });


}


module.exports = initSocketServer