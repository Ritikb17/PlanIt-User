const express = require('express');
const router = express.Router();
const {sendMessage,editmessage,deleteMessage} = require('../controllers/messageControler');
router.post('/send-message',sendMessage);
router.post('/edit-message/:messageId',editmessage);
router.delete('/delete-message/:messageId',deleteMessage);

module.exports = router;