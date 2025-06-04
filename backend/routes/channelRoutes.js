const express = require('express');
const router = express.Router();
const {createChannel,deleteChannel,sendChannelConnectionRequest,
    removeChannelConnectionRequest,unsendChannelConnectionRequest,
    acceptChannelConnectionRequest,updateChannelInfo,getMyChannels,
    leaveChannel,getRequestChannels,getDiscoverChannels,getOtherUserChannels
    ,getConnectedUsersChannel,unblockUserChannel,blockUserChannel,removeUserFromChannel} = require('../controllers/channelController');

router.get('/get-my-channels',getMyChannels);
router.get('/get-other-user-channels',getOtherUserChannels);
router.get('/get-request-channels',getRequestChannels)
router.get('/discover-channels',getDiscoverChannels)
router.post('/create-channel',createChannel);
router.delete('/delete-channel/:channelId',deleteChannel);


router.put('/send-channel-connection-request-by-creator',sendChannelConnectionRequest)
router.put('/unsend-channel-connection-request-by-creator',unsendChannelConnectionRequest)
router.put('/remove-channel-connection-request-by-other-user',removeChannelConnectionRequest)



router.delete('/leave-channel/:channelId',leaveChannel);

router.put('/accept-channel-connection-request-by-other-user',acceptChannelConnectionRequest)
// router.delete('/delete-channel',deleteChannel);
router.patch('/update-channel-info/:channelId',updateChannelInfo)


router.get('/get-channel-users',getConnectedUsersChannel)
router.post('/unblock-channel-user', unblockUserChannel);
router.post('/block-channel-user', blockUserChannel);
router.post('remove-user-from-channel', removeUserFromChannel);

module.exports = router;