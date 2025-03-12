const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { GiToken } = require("react-icons/gi");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Register
router.post("/register", async (req, res) => {
    try {
        const { username, email, password ,name} = req.body;
        const user = new User({ username, email, password ,name});
        await user.save();
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.status(201).json({ message: "User registered successfully" , token:token});
        // res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
