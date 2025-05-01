const express = require('express');
const router = express.Router();
const {createEvent, getMyEvents,updateEventInfo} = require('../controllers/eventController');

// router.get('/get-other-user-events',getOtherUserEvents);
// router.get('/get-request-events',getRequestEvents)
// router.get('/discover-events',getDiscoverEvents)
router.post('/create-event',createEvent);
router.get('/get-my-events',getMyEvents);
router.patch('/update-event-info/:eventId',updateEventInfo)
// router.delete('/delete-events/:eventId',deleteEvent);
// router.put('/send-event-connection-request-by-creator',sendEventConnectionRequest)
// router.put('/unsend-event-connection-request-by-creator',unsendChannelConnectionRequest)
// router.put('/remove-event-connection-request-by-other-user',removeChannelConnectionRequest)
// router.delete('/leave-event/:eventId',leaveEvent);
// router.put('/accept-event-connection-request-by-other-user',acceptEventConnectionRequest)
// router.delete('/delete-event',deleteEvent);

module.exports = router;