const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../config/multerConfigForChat')
const {sendMessage,editmessage,deleteMessage,getMessages,getChatMessageFile} = require('../controllers/messageController');

router.post('/send-chat-message-with-file/:chatId',upload.single('file'),sendMessage);
router.get('/get-chat-message-file/:chatId/:file',getChatMessageFile);
router.get('/get-messages',getMessages);
router.post('/edit-message/:messageId',editmessage);
router.delete('/delete-message/:messageId',deleteMessage);

module.exports = router;