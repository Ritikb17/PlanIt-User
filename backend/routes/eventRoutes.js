const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {createEvent, getMyEvents,
    updateEventInfo,sendEventConnectionRequest,
    sendEventConnectionRequestByOtherUser,unsendEventConnectionRequestByOtherUser,
    leaveEvent,unsendEventConnectionRequest,acceptEventConnectionRequestSendByOtherUser,
    rejectEventConnectionRequestSendByOtherUser,rejectEventConnectionRequestSendByCreator,
    deleteEvent,getEventConnectionRequestListToEvents,getEventConnectionRequestListToUser,acceptEventConnectionRequestSendByCreator,
    getEventRequests,getConnectionForEventConnectionRequest,getSuggestionsForEventConnectionRequest,discoverEvent,blockUserEvent,
    unblockUserEvent,getConnectedUsersEvent,removeUserFromEvent} = require('../controllers/eventController');

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


router.get('/get-connections-for-event-request/:eventId',getConnectionForEventConnectionRequest)
router.get('/get-suggestion-for-event-request/:eventId',getSuggestionsForEventConnectionRequest)

//update the event information 
router.patch('/update-event-info/:eventId',updateEventInfo)

//send event connection request by creator 
router.put('/send-event-connection-request-by-creator',sendEventConnectionRequest) // creator send request to other user

//unsend event connection request by creator 
router.put('/unsend-event-connection-request-by-creator',unsendEventConnectionRequest)

//accept request by other user send by creator 
router.put('/accept-event-connection-request-sendby-creator',acceptEventConnectionRequestSendByCreator)

// reject request send by the creator
router.put('/reject-event-connection-sendby-by-creator',rejectEventConnectionRequestSendByCreator)
//send the connection request by other user 
router.put('/send-event-connection-request-by-other-user',sendEventConnectionRequestByOtherUser) 
router.put('/unsend-event-connection-request-by-other-user',unsendEventConnectionRequestByOtherUser) 
//accept request by other user send by other user  
router.put('/accept-event-connection-sendby-otheruser',acceptEventConnectionRequestSendByOtherUser)
//reject request send by the other user
router.put('/reject-event-connection-sendby-by-otheruser',rejectEventConnectionRequestSendByOtherUser)
router.put('/leave-event',leaveEvent);
router.get('/get-event-requests',getEventRequests);
//blocks user from event by creator 
router.put('/block-user-event',blockUserEvent)
//unblock user from event by creator
router.put('/unblock-user-event',unblockUserEvent)
//discover events 
router.get('/discover-events',discoverEvent);
//delete event
router.delete('/delete-event',deleteEvent);
//get the connected users (members) of the event
router.get('/get-event-users',getConnectedUsersEvent)
router.put("/remove-user-from-event",removeUserFromEvent)
module.exports = router;