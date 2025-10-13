const mongoose = require('mongoose');
const User = require('../models/User')
 
// Return all past events of the user
const getMyPastEvents = async (req, res) => {
    const _id = req.user._id;
    try {
        const data = await User.findById(_id)
            .populate('connectedEvents')
            .select('connectedEvents');

        if (!data) {
            return res.status(400).json({ error: "Error in fetching data" });
        }

        // Get current date/time
        const currentDate = new Date();

        // Filter out past events
        const upcomingEvents = data.connectedEvents.filter(event => {
            return new Date(event.eventDate) < currentDate;
        });

        res.status(200).json({
            events: {
                ...data.toObject(),
                connectedEvents: upcomingEvents
            }
        });

    } catch (error) {
        res.status(400).json({ error: error.message }); // Better to send error.message
    }
}

module.exports = {
    getMyPastEvents
};