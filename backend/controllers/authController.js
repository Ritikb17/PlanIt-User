const User = require("../models/users");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ name, email, password });
    const check= await user.save();
    if(check)
      res.status(201).json({ message: "User registered successfully" });
    else
      res.status(400).json({message:"not creatd user "});

  } catch (error) {
    console.log("ERROR FACING IS ",error);
    res.status(500).json({ message: "Server Error" ,error:error});
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
