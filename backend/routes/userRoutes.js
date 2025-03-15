const express = require("express");
const router = express.Router();
const {sendRequest,acceptRequest,getSuggestion,getConnections,BlockUser,unBlockUser,removeUser} = require('../controllers/userController')

router.put("/send-request",sendRequest);
router.put("/accept-request",acceptRequest);
router.put("/remove-user",removeUser);
router.get("/get-suggestion",getSuggestion);
router.get("/get-connections",getConnections);
router.put("/block-user",BlockUser);
router.put("/unblock-user",unBlockUser);

module.exports = router;
