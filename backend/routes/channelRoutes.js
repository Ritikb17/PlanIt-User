const express = require('express');
const router = express.Router();
const {createChannel,deleteChannel,sendChannelConnectionRequest} = require('../controllers/channelController');


router.post('/create-channel',createChannel);
router.put('/send-channel-connection-request',sendChannelConnectionRequest)
router.delete('/delete-channel/:channelId',deleteChannel);





module.exports = router;