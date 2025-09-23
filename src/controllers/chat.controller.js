const chatModel = require("../model/chat.model");


async function createChat(req, res) {
  const { title } = req.body;
  const user=req.user;
  const chat=await chatModel.create({
    user:user._id,
    title
  });
  res.status(201).json({ message: "chat created successfully",
     chat:{
      _id:chat._id,
      title:chat.title,
      user:user.fullName,
      lastActivity:chat.LastActivity
     }
    });
}



module.exports = { createChat };