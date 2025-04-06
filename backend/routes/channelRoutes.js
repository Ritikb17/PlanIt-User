const express = require('express');
const router = express.Router();
const {createChannel,deleteChannel,sendChannelConnectionRequest,removeChannelConnectionRequest,unsendChannelConnectionRequest,acceptChannelConnectionRequest,updateChannelInfo,getChannels,leaveChannel,getRequestChannels,getDiscoverChannels} = require('../controllers/channelController');

router.get('/get-channels',getChannels);
router.get('/get-request-channels',getRequestChannels)
router.get('/discover-channels',getDiscoverChannels)

router.post('/create-channel',createChannel);
router.delete('/delete-channel/:channelId',deleteChannel);

router.put('/send-channel-connection-request-by-creator',sendChannelConnectionRequest)
router.put('/unsend-channel-connection-request-by-creator',unsendChannelConnectionRequest)

router.put('/remove-channel-connection-request-by-other-user',removeChannelConnectionRequest)

router.put('/leave-channel/:channelId',leaveChannel);
router.put('/accept-channel-connection-request-by-other-user',acceptChannelConnectionRequest)
router.delete('/delete-channel',deleteChannel);
router.patch('/update-channel-info/:channelId',updateChannelInfo)

module.exports = router;