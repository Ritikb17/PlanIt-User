const Event = require('../models/event');
const User = require('../models/User');
const createEvent = async (req, res) => {
    const _id = req.user._id;
    const { name: name, bio, status: isPrivate, eventDate: eventDate } = req.body; // Destructure request body

    try {

        const user = await User.findById(_id);
        console.log("new eventDate  is ", eventDate);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userWithEvents = await User.findById(_id).populate('events');
        const nameCheck = userWithEvents.events.some(event => event.name === name);
        console.log("this is name check ", nameCheck);
        if (nameCheck) {
            return res.status(400).json({ message: "Event with the same name already exists" });
        }

        const newEvent = await Event.create({
            name: name,
            description: bio,
            isPrivate: req.body.isPrivate,
            createdBy: _id,
            eventDate: eventDate,
            members: [_id],
        });
        console.log("new Event is ", newEvent);
        if (newEvent) {
            console.log("new channel is being created ")
            const newC = { _id: newEvent._id, name: name };
            const addInUser = await User.findByIdAndUpdate(
                _id,
                { $push: { events: newEvent._id } },
                { new: true }
            );
            if (!addInUser) {
                return res.status(400).json({ message: "Failed to update user with new event" });
            }
        } else {
            return res.status(500).json({ error: "cannot create event" });
        }




        return res.status(201).json({ message: "event created successfully", channel: newEvent });
    } catch (error) {
        console.error("Error creating channel:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
const getMyEvents = async (req, res) => {
    const _id = req.user._id;
    try {
        const data = await User.findById(_id).populate('events').select('events');
        if (!data) {
            res.status(400).json({ error: "error in fetching data" })
        }
        res.status(200).json({ connectedEvents: data });

    } catch (error) {
        res.status(400).json({ error: error })
    }
}
const updateEventInfo = async (req, res) => {
    const event__id = req.params.eventId;
    const _id = req.user._id;
    const data = req.body;
    try {
        const eventInfo = await Event.findById(event__id);



        if (!eventInfo.createdBy.equals(_id)) {
            return res.status(403).json({ message: 'You do not have permission to edit this channel' });
        }

        const userWithEvents = await User.findById(_id).populate('events');
        const nameCheck = userWithEvents.events.some(event => event.name === data.name);
        if (nameCheck) {
            return res.status(400).json({ message: "Event with the same name already exists" });
        }


        const update = await Event.findByIdAndUpdate(event__id, data);
        if (update) {
            res.status(200).json({ message: "data has been updated" });
        }
    } catch (error) {
        console.log("the error is ",error);
        res.status(400).json({ error: error });

    }
}
const deleteEvent = async (req, res) => {
    const _id = req.user._id; // User ID
    const event__id = req.params.eventId; // Channel ID to delete
    const obj_event_id = new mongoose.Types.ObjectId(event__id);

    try {
        const event = await Event.findById(event__id);
        if (!event) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        if (!event.createdBy.equals(_id)) {
            return res.status(403).json({ message: 'You do not have permission to delete this channel' });
        }

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // const channelExists = user.channel.some(ch => ch._id.toString() === channel__id);
        // if (!channelExists) {
        //     return res.status(400).json({ message: 'Channel not found in the user channel list' });
        // }



        const ev = await Event.findById(event__id);
        console.log("Connected Users are:", ev.members);


        // removing channel from all the users 
        for (const member of ev.members) {

            await User.findByIdAndUpdate(member,
                { $pull: { connectedChannels: channel__id } });

        }

        // removing the channel id from the user 
        const updatedUser = await User.findByIdAndUpdate(
            _id,
            { $pull: { channel: { _id: obj_channel_id } } },
            { new: true }
        );



        if (!updatedUser) {
            return res.status(400).json({ message: 'Failed to update user' });
        }


        // Delete the channel from the Channel collection
        const deletedChannel = await Channel.findByIdAndDelete(channel__id);
        if (!deletedChannel) {
            return res.status(400).json({ message: 'Failed to delete channel' });
        }

        // Success response
        return res.status(200).json({ message: 'Channel deleted successfully' });
    } catch (error) {
        console.error('Error deleting channel:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
module.exports = { createEvent,getMyEvents ,updateEventInfo,deleteEvent};

