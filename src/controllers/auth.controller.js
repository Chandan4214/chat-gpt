// const UserModel = require("../model/user.model");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// async function register(req, res) {
//   const {
//     email,
//     fullname,
//     password,
//   } = req.body;
//   console.log(req.body);
//   try {
//     const isUserExists = await UserModel.findOne({ email });
//     if (isUserExists) {
//       return res.status(409).json({ message: "user already exists" });
//     }
//     const hash = await bcrypt.hash(password, 10);
//     const user = await UserModel.create({
//       email,
//       fullname,
//       password: hash,
//     });
//     res.status(201).json({
//       message: "user created successfully",
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// async function login(req, res) {
//   const { email, password } = req.body;
//   try {
//     const user = await UserModel.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "user not found" });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "invalid credentials" });
//     }
//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     res.status(200), json({ message: "lofin successful", token, user });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// module.exports = { register, login };





const UserModel = require("../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  const {
    email,
    fullName: { firstName, lastName },
    password,
  } = req.body;
  console.log(req.body);
  try {
    const isUserExists = await UserModel.findOne({ email });
    if (isUserExists) {
      return res.status(409).json({ message: "user already exists" });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email,
      fullName: { firstName, lastName },
      password: hash,
    });
    res.status(201).json({
      message: "user created successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.cookie("token", token, {
      httpOnly: true,      // prevents JS access (XSS protection)
      secure: process.env.NODE_ENV === "production", // only HTTPS in production
      sameSite: "strict",  // CSRF protection
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    
    res.status(200).json({ message: "login successful", token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { register, login };
