const express = require('express');
const router = express.Router();
const { createChannel, deleteChannel, sendChannelConnectionRequest,
    removeChannelConnectionRequest, unsendChannelConnectionRequest,
    acceptChannelConnectionRequest, updateChannelInfo, getMyChannels,
    leaveChannel, getRequestChannels, getDiscoverChannels, getOtherUserChannels
    , getConnectedInfoChannel, unblockUserChannel, blockUserChannel,
    removeUserFromChannel, getBlockUsersOFChannel, sendChannelConnectionRequestByOtherUser,
    unsendChannelConnectionRequestByOtherUser, removeChannelConnectionRequestByCreator,
    acceptChannelConnectionRequestByCreator, getRequestToChannelsSendOtherUser
,createChannelPool} = require('../controllers/channelController');

router.get('/get-my-channels', getMyChannels);
router.get('/get-other-user-channels', getOtherUserChannels);
router.get('/get-request-channels', getRequestChannels)
router.get('/discover-channels', getDiscoverChannels)
router.post('/create-channel', createChannel);
router.delete('/delete-channel/:channelId', deleteChannel);


router.put('/send-channel-connection-request-by-creator', sendChannelConnectionRequest)

router.put('/unsend-channel-connection-request-by-creator', unsendChannelConnectionRequest)
router.put('/remove-channel-connection-request-by-other-user', removeChannelConnectionRequest)



router.delete('/leave-channel/:channelId', leaveChannel);

router.put('/accept-channel-connection-request-by-other-user', acceptChannelConnectionRequest)
// router.delete('/delete-channel',deleteChannel);
router.patch('/update-channel-info/:channelId', updateChannelInfo)

//send channel connection request by other user

router.put('/send-channel-connection-request-by-other-user', sendChannelConnectionRequestByOtherUser)
//unsend connection request by other user
router.put('/unsend-channel-connection-request-by-other-user', unsendChannelConnectionRequestByOtherUser)
// //remove channel connection request by creator
router.put('/reject-channel-connection-request-by-creator', removeChannelConnectionRequestByCreator)
// //accept the channel connection request by creator
router.put('/accept-channel-connection-request-by-creator', acceptChannelConnectionRequestByCreator)


router.get('/get-channel-info/:channelId?', getConnectedInfoChannel)
router.get('/get-channel-block-users', getBlockUsersOFChannel)
router.get('/get-request-to-the-channel-send-by-other-user/:channelId?', getRequestToChannelsSendOtherUser); 
router.post('/unblock-user-from-channel', unblockUserChannel);
router.post('/block-user-from-channel', blockUserChannel);
router.post('/remove-user-from-channel', removeUserFromChannel);

// router.post('/create-channel-pool',createChannelPool)


module.exports = router;