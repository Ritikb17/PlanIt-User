const express = require("express");
const{login,register} = require('../controllers/authController')



const { GiToken } = require("react-icons/gi");

const router = express.Router();


router.post("/register", register);

router.post("/login", login);


module.exports = router;
