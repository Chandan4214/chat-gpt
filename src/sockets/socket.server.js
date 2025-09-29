// const { Server } = require("socket.io");
// const cookie = require("cookie");
// const jwt = require("jsonwebtoken");
// const UserModel = require("../model/user.model");
// const aiService = require("../services/ai.service");
// const messageModel = require("../model/message.model");
// const { createMemory, queryMemory } = require("../services/vector.service");

// function initSocketServer(httpServer) {
//   const io = new Server(httpServer, {});

//   // Middleware for auth
//   io.use(async (socket, next) => {
//     const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
//     if (!cookies.token) {
//       return next(new Error("Authentication error"));
//     }

//     try {
//       const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
//       const user = await UserModel.findById(decoded.id);
//       socket.user = user;
//       next();
//     } catch (err) {
//       return next(new Error("Authentication error"));
//     }
//   });

//   io.on("connection", (socket) => {
//     socket.on("ai-message", async (msgPayload) => {
//       try {
//         console.log("AI Message received:", msgPayload);

//         if (typeof msgPayload === "string") {
//           msgPayload = JSON.parse(msgPayload);
//         }

//         console.log(
//           "Parsed AI Message payload:",
//           msgPayload.chat,
//           msgPayload.content
//         );

//         //Save incoming user message
//         /*
//         const message = await messageModel.create({
//           chat: msgPayload.chat,
//           user: socket.user._id,
//           content: msgPayload.content,
//           role: msgPayload.role,
//         });

//         // Generate embedding
//         const vectors = await aiService.generateVector(msgPayload.content);

// */

//         const [message, vectors] = await Promise.all([
//           messageModel.create({
//             chat: msgPayload.chat,
//             user: socket.user._id,
//             content: msgPayload.content,
//             role: msgPayload.role,
//           }),
//           aiService.generateVector(msgPayload.content),

//           createMemory({
//             vectors: vectors[0].values,
//             messageId: message._id.toString(),
//             metadata: {
//               chat: msgPayload.chat,
//               user: socket.user._id.toString(),
//               text: msgPayload.content,
//             },
//           }),
//         ]);

//         // ✅ First store in Pinecone
//         /*       await createMemory({
//           vectors: vectors[0].values,
//           messageId: message._id.toString(),
//           metadata: {
//             chat: msgPayload.chat,
//             user: socket.user._id.toString(),
//             text: msgPayload.content,
//           },
//       });

//       */

//         // ✅ Then query Pinecone for relevant memory

//         /* 
//         const memory = await queryMemory({
//           queryVector: vectors[0].values,
//           limit: 3,
//           metadata: { chat: msgPayload.chat },
//           user: socket.user._id.toString(),
//         });
//         console.log("Retrieved Memory:", memory);

//         // Build chat history (last 10 messages)
//         const chatHistory = (
//           await messageModel
//             .find({ chat: msgPayload.chat })
//             .sort({ createdAt: -1 })
//             .limit(10)
//         ).reverse();

        


        

//         */


//       const [memory, chatHistory]=Promise.all([
//          queryMemory({
//           queryVector: vectors[0].values,
//           limit: 3,
//           metadata: { chat: msgPayload.chat },
//           user: socket.user._id.toString(),
//         }),
//         messageModel.find({ chat: msgPayload.chat })
//             .sort({ createdAt: -1 })
//             .limit(10)
//             .reverse()


//       ]);





//       const stm = chatHistory.map((item) => ({
//           role: item.role,
//           parts: [{ text: item.content }],
//         }));
      

//         const ltm = [
//           {
//             role: "user",
//             parts: [
//               {
//                 text: `
//                these are some previous chat history of the chat use them to answer the question if relevant
//                ${memory
//                  .map((m, i) => `${i + 1}. ${m.metadata.text}`)
//                  .join("\n")}
//                `,
//               },
//             ],
//           },
//         ];

//         console.log("Long Term Memory:", ltm[0]);
//         console.log("Short Term Memory:", stm);

//         // Generate AI response
//         const response = await aiService.generateResponse([...ltm, ...stm]);

//         // Save response in DB
//   /*      const responseMessage = await messageModel.create({
//           chat: msgPayload.chat,
//           user: socket.user._id.toString(),
//           content: response,
//           role: "model",
//         });

//         // Embed response
//         const responseVectors = await aiService.generateVector(response);
//   */

   

//         // Send back to client
//         socket.emit("ai-response", {
//           content: response,
//           chat: msgPayload.chat,
//         });
//       } catch (err) {
//         console.error("❌ AI Message Handler Error:", err.message, err.stack);
//         socket.emit("ai-response", {
//           content: "⚠️ Something went wrong while processing your request.",
//           chat: msgPayload?.chat,
//         });

//       }

//           const [responseMessage, responseVectors]= await Promise.all([
//             messageModel.create({
//               chat: msgPayload.chat,
//               user: socket.user._id.toString(),
//               content: response,
//               role: "model",
//             }),
//             aiService.generateVector(response),
//      ]);
//       await createMemory({
//           vectors: responseVectors[0].values,
//           messageId: responseMessage._id.toString(),
//           metadata: {
//             chat: msgPayload.chat,
//             user: socket.user._id.toString(),
//             text: response,
//           },
//         });
 



//     });
//   });
// }

// module.exports = initSocketServer;





// src/sockets/socket.server.js
const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../model/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  // ✅ Middleware for JWT auth
  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    if (!cookies.token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded.id);
      if (!user) return next(new Error("Authentication error"));

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.user.email}`);

    socket.on("ai-message", async (msgPayload) => {
      try {
        if (typeof msgPayload === "string") {
          msgPayload = JSON.parse(msgPayload);
        }

        console.log("AI Message received:", msgPayload);

        // ==============================
        // 1. Save user message + generate vector
        // ==============================
        const [message, vectors] = await Promise.all([
          messageModel.create({
            chat: msgPayload.chat,
            user: socket.user._id,
            content: msgPayload.content,
            role: msgPayload.role || "user",
          }),
          aiService.generateVector(msgPayload.content),
        ]);

        // Store in Pinecone
        await createMemory({
          vectors: vectors[0].values,
          messageId: message._id.toString(),
          metadata: {
            chat: msgPayload.chat,
            user: socket.user._id.toString(),
            text: msgPayload.content,
          },
        });

        // ==============================
        // 2. Retrieve memory + chat history
        // ==============================
        const [memory, chatHistory] = await Promise.all([
          queryMemory({
            queryVector: vectors[0].values,
            limit: 3,
            metadata: { chat: msgPayload.chat },
          }),
          messageModel
            .find({ chat: msgPayload.chat })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
        ]);

        const stm = chatHistory.reverse().map((item) => ({
          role: item.role,
          parts: [{ text: item.content }],
        }));

        const ltm = [
          {
            role: "user",
            parts: [
              {
                text: `These are some previous chat history of the chat. Use them if relevant:\n${memory
                  .map((m, i) => `${i + 1}. ${m.metadata.text}`)
                  .join("\n")}`,
              },
            ],
          },
        ];

        // ==============================
        // 3. Generate AI response
        // ==============================
        const response = await aiService.generateResponse([...ltm, ...stm]);

        // ✅ 4. Emit response immediately to client
        socket.emit("ai-response", {
          content: response,
          chat: msgPayload.chat,
        });

        // ==============================
        // 5. Save AI response + embed (after emit)
        // ==============================
        (async () => {
          try {
            const [responseMessage, responseVectors] = await Promise.all([
              messageModel.create({
                chat: msgPayload.chat,
                user: socket.user._id.toString(),
                content: response,
                role: "model",
              }),
              aiService.generateVector(response),
            ]);

            await createMemory({
              vectors: responseVectors[0].values,
              messageId: responseMessage._id.toString(),
              metadata: {
                chat: msgPayload.chat,
                user: socket.user._id.toString(),
                text: response,
              },
            });
          } catch (err) {
            console.error("⚠️ Failed to save AI response in DB/Pinecone:", err);
          }
        })();

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
