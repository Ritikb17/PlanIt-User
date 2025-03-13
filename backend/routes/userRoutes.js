const express = require("express");
const router = express.Router();
const {sendRequest,acceptRequest} = require('../controllers/userController')

router.put("/send-request",sendRequest);
router.put("/accept-request",acceptRequest);

module.exports = router;
