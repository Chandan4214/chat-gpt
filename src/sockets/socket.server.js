
const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../model/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  // Middleware for auth
  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    if (!cookies.token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded.id);
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("ai-message", async (msgPayload) => {
      try {
        console.log("AI Message received:", msgPayload);

        if (typeof msgPayload === "string") {
          msgPayload = JSON.parse(msgPayload);
        }

        console.log(
          "Parsed AI Message payload:",
          msgPayload.chat,
          msgPayload.content
        );

        // Save incoming user message
        const message = await messageModel.create({
          chat: msgPayload.chat,
          user: socket.user._id,
          content: msgPayload.content,
          role: msgPayload.role,
        });

        // Generate embedding
        const vectors = await aiService.generateVector(msgPayload.content);
        console.log("Generated Vectors:", vectors);

        // ✅ First store in Pinecone
        await createMemory({
          vectors: vectors[0].values,
          messageId: message._id.toString(),
          metadata: {
            chat: msgPayload.chat,
            user: socket.user._id.toString(),
            text: msgPayload.content,
          },
        });

        // ✅ Then query Pinecone for relevant memory
        const memory = await queryMemory({
          queryVector: vectors[0].values,
          limit: 3,
          metadata: { chat: msgPayload.chat },
          user: socket.user._id.toString(),
        });
        console.log("Retrieved Memory:", memory);

        // Build chat history (last 10 messages)
        const chatHistory = (
          await messageModel
            .find({ chat: msgPayload.chat })
            .sort({ createdAt: -1 })
            .limit(10)
        ).reverse();

       const stm=  chatHistory.map((item) => ({
            role: item.role,
            parts: [{ text: item.content }],
          }))

      const ltm= [
         {
            role: "user",
            parts:[{text:`
               these are some previous chat history of the chat use them to answer the question if relevant
               ${memory.map((m,i)=>`${i+1}. ${m.metadata.text}`).join("\n")}
               ` }]
         }
      ]

         console.log("Long Term Memory:",ltm[0])
         console.log("Short Term Memory:",stm) 


        // Generate AI response
        const response = await aiService.generateResponse([...ltm,...stm])
        
        

        // Save response in DB
        const responseMessage = await messageModel.create({
          chat: msgPayload.chat,
          user: socket.user._id.toString(),
          content: response,
          role: "model",
        });

        // Embed response
        const responseVectors = await aiService.generateVector(response);

        await createMemory({
          vectors: responseVectors[0].values,
          messageId: responseMessage._id.toString(),
          metadata: {
            chat: msgPayload.chat,
            user: socket.user._id.toString(),
            text: response,
          },
        });

        // Send back to client
        socket.emit("ai-response", {
          content: response,
          chat: msgPayload.chat,
        });
      } catch (err) {
        console.error("❌ AI Message Handler Error:", err.message, err.stack);
        socket.emit("ai-response", {
          content: "⚠️ Something went wrong while processing your request.",
          chat: msgPayload?.chat,
        });
      }
    });
  });
}

module.exports = initSocketServer;


