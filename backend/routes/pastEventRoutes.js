const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const {getMyPastEvents,reportEventUsers} = require('../controllers/afterEventController');
router.get('/get-my-past-events',getMyPastEvents);
// router.post('/report-user/:eventId',reportEventUsers);
// router.post('/attendence-of-event/:eventId',puteventAttendence);


// router.post('/give-feedback-and-rating/:eventId',giveFeedback);   


module.exports = router;

// router.get('/get-other-user-after-events',getOtherUserAfterEvents);