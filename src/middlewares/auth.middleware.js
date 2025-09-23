const userModel= require('../model/user.model');
const jwt=require('jsonwebtoken');

async function authUser(req, res, next) {
  console.log("middleware called")
  const token = req.cookies.token || req.header('Authorization').replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({message:"Unauthorized"});
  }
    try {
      const decoded=jwt.verify(token,process.env.JWT_SECRET);

      const user=await userModel.findById(decoded.id);
      req.user=user;
      next()
    } 
    
    catch (error) {
        res.status(401).json({message:"Invalid Token"});
    }
}


module.exports=authUser;