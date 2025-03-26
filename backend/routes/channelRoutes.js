const express = require('express');
const router = express.Router();
const {createChannel,deleteChannel,sendChannelConnectionRequest,removeChannelConnectionRequest,unsendChannelConnectionRequest,acceptChannelConnectionRequest, deleteChannel} = require('../controllers/channelController');


router.post('/create-channel',createChannel);
router.delete('/delete-channel/:channelId',deleteChannel);

router.put('/send-channel-connection-request-by-creator',sendChannelConnectionRequest)
router.put('/unsend-channel-connection-request-by-creator',unsendChannelConnectionRequest)

router.put('/remove-channel-connection-request-by-other-user',removeChannelConnectionRequest)
router.put('/accept-channel-connection-request-by-other-user',acceptChannelConnectionRequest)
router.delete('/delete-channel',deleteChannel);





module.exports = router;