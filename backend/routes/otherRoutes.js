const express = require('express');
const router = express.Router();
const {searchUser,getEventDetails,getChannelInfo} = require('../controllers/otherController')
router.get('/search-user/:search', searchUser);
// get event details by event id
router.get('/get-event-details/:eventId', getEventDetails);
router.get('/get-channel-info/:channelId', getChannelInfo);

module.exports = router;