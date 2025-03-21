const express = require("express");
const router = express.Router();
const {sendRequest,acceptRequest,getSuggestion,getConnections,BlockUser,unBlockUser,removeUser,getNotification,rejectRequest,getBlockList,getUser,alreadySendRequest,unsendRequest} = require('../controllers/userController')

router.put("/send-request",sendRequest);
router.put("/unsend-request",unsendRequest);
router.put("/accept-request",acceptRequest);
router.put("/reject-request",rejectRequest);
router.put("/remove-user",removeUser);
router.get("/get-suggestion",getSuggestion);
router.get("/get-connections",getConnections);
router.get("/get-block-users",getBlockList);
router.put("/block-user",BlockUser);
router.put("/unblock-user",unBlockUser);
router.get("/get-notification",getNotification);
router.get('/get-user/:username',getUser);
router.get('/already-send-request/:username',alreadySendRequest);


module.exports = router;
