const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {createEvent, getMyEvents,updateEventInfo,sendEventConnectionRequest,sendEventConnectionRequestByOtherUser,unsendEventConnectionRequestByOtherUser,leaveEvent,unsendEventConnectionRequest,acceptEventConnectionRequestSendByOtherUser,rejectEventConnectionRequestSendByOtherUser,rejectEventConnectionRequestSendByCreator,deleteEvent,getEventConnectionRequestListToEvents,getEventConnectionRequestListToUser} = require('../controllers/eventController');

// router.get('/get-other-user-events',getOtherUserEvents);
// router.get('/get-request-events',getRequestEvents)
// router.get('/discover-events',getDiscoverEvents)
// router.delete('/delete-events/:eventId',deleteEvent);
// router.put('/unsend-event-connection-request-by-creator',unsendChannelConnectionRequest)
// router.put('/remove-event-connection-request-by-other-user',removeChannelConnectionRequest)


router.post('/create-event',createEvent);
router.get('/get-my-events',getMyEvents);

//send the list of the event connection to the event 
router.get('/get-event-connecton-request-list-to-event',getEventConnectionRequestListToEvents)
//send the list of the event connection to the user
router.get('/get-event-connecton-request-list-to-user',getEventConnectionRequestListToUser)


router.patch('/update-event-info/:eventId',updateEventInfo)


router.put('/send-event-connection-request-by-creator',sendEventConnectionRequest) // creator send request to other user
router.put('/unsend-event-connection-request-by-creator',unsendEventConnectionRequest)

router.put('/send-event-connection-request-by-other-user',sendEventConnectionRequestByOtherUser) 
router.put('/unsend-event-connection-request-by-other-user',unsendEventConnectionRequestByOtherUser) 

// router.put('/accept-event-connection-request-by-creator',acceptEventConnectionRequest)
router.put('/accept-event-connection-sendby-otheruser',acceptEventConnectionRequestSendByOtherUser)

//reject request send by the other user
router.put('/reject-event-connection-sendby-by-otheruser',rejectEventConnectionRequestSendByOtherUser)
// reject request send by the creator
router.put('/reject-event-connection-sendby-by-creator',rejectEventConnectionRequestSendByCreator)



router.delete('/leave-event/:eventId',leaveEvent);

router.delete('/delete-event',deleteEvent);

module.exports = router;