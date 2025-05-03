const mongoose = require('mongoose')
const User = require('../models/User')

console.log('User import:', User);  // Should show Mongoose model functions
const Event = require('../models/event');
const Notification = require('../models/notification');
const createEvent = async (req, res) => {
    const _id = req.user._id;
    console.log("user is", _id);
    const { name: name, bio, status: isPrivate, eventDate: eventDate } = req.body; // Destructure request body

    try {

        console.log('User model:', User); // Check if this shows a Mongoose model
        console.log('Does findById exist?', typeof User.findById);

        const user = await User.findById(_id);
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
        console.log("the error is ", error);
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
const sendEventConnectionRequest = async (req, res) => {
    const _id = req.user._id;
    const event__id = req.body.eventId;
    const sender_id = req.body.senderId;
    const obj_sender_id = new mongoose.Types.ObjectId(sender_id);
    try {

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate the event
        const event = await Event.findById(event__id);

        const check1 = event.members.includes(sender_id);
        if (check1) {
            return res.status(400).json({ message: "already member of this channel" });
        }



        // Validate the sender
        const senderUser = await User.findById(sender_id);
        if (!senderUser) {
            return res.status(404).json({ message: "Sender not found" });
        }

        // Check if the sender is trying to send a request to themselves
        if (sender_id === _id) {
            return res.status(400).json({ message: "You cannot send a request to yourself" });
        }

        // Check if the request has already been sent
        if (event.sendRequest.includes(sender_id)) {
            return res.status(400).json({ message: "Request already sent" });
        }
        if (event.recivedRequest.includes(sender_id)) {
            return res.status(400).json({ message: "Request already in the array " });
        }

        // Add the sender to the channel's sendRequest array
        const updateEvent = await Event.findByIdAndUpdate(
            event__id,
            { $push: { sendRequest: sender_id } },
            { new: true }
        );

        if (!updateEvent) {
            return res.status(400).json({ message: "Failed to send request to channel" });
        }

        // Add the channel to the sender's receivedChannelRequest array
        const updatedSender = await User.findByIdAndUpdate(
            sender_id,
            { $push: { receivedEventRequest: event__id } }, // Corrected spelling
            { new: true }
        );

        if (!updatedSender) {
            return res.status(400).json({ message: "Failed to update sender's request list" });
        }

        // Success response
        const notificationVerification = await Notification.findOneAndUpdate(
            { user: obj_sender_id },
            {
                $push: {
                    notification: {
                        message: "GOT YOU EVENT CONNECTION  REQUEST",
                        type: "event", // Changed to match your schema enum
                        // isSeen will default to false as per your schema
                    },
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true // Ensures defaults are set on new documents
            }
        );



        return res.status(200).json({ message: "Request sent successfully" });
    } catch (error) {
        console.error("Error sending channel connection request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
const unsendEventConnectionRequest = async (req, res) => {
    const _id = req.user._id;
    const event__id = req.body.eventId;
    const sender_id = req.body.senderId;
    const obj_sender_id = new mongoose.Types.ObjectId(sender_id);
    try {

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }


        const event = await Event.findById(event__id);


        const senderUser = await User.findById(sender_id);
        if (!senderUser) {
            return res.status(404).json({ message: "Sender not found" });
        }

        if (!event.sendRequest.includes(sender_id)) {
            return res.status(400).json({ message: "REQUEST NOT FOUND IN THE ARRAY " });
        }

        const updateEvent = await Event.findByIdAndUpdate(
            event__id,
            { $pull: { sendRequest: sender_id } },
            { new: true }
        );

        if (!updateEvent) {
            return res.status(400).json({ message: "Failed to send request to channel" });
        }


        const updatedSender = await User.findByIdAndUpdate(
            sender_id,
            { $pull: { receivedEventRequest: event__id } },
            { new: true }
        );

        if (!updatedSender) {
            return res.status(400).json({ message: "Failed to update sender's request list" });
        }

        // Success response
        const notificationVerification = await Notification.findOneAndUpdate(
            { user: obj_sender_id },
            {
                $push: {
                    notification: {
                        message: "GOT YOU EVENT CONNECTION  REQUEST",
                        type: "event", // Changed to match your schema enum
                        // isSeen will default to false as per your schema
                    },
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true // Ensures defaults are set on new documents
            }
        );



        return res.status(200).json({ message: "Request sent successfully" });
    } catch (error) {
        console.error("Error sending channel connection request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
const sendEventConnectionRequestByOtherUser = async (req, res) => {
    const sender_id = req.user._id;
    const _id = req.user._id;
    const event__id = req.body.eventId;

    const obj_sender_id = new mongoose.Types.ObjectId(sender_id);
    try {
        const event = await Event.findById(event__id);
        const isSenderBlockes = event.blockedUsers.includes(sender_id);
        const senderUser = await User.findById(sender_id);
        if (!senderUser) {
            return res.status(404).json({ message: "Sender not found" });
        }
        const creatorId = event.createdBy;
        if (event.members.includes(sender_id)) {
            return res.status(400).json({ message: "ALREADY MEMBER OF THE EVENT " });
        }
        if (isSenderBlockes) {
            return res.status(400).json({ message: "you cannnot send request to the event  contact the owner of the event " })
        }
        if (event.isPrivate) {
            if (!senderUser.connections.includes(_id)) {
                return res.status(400).json({ message: "this is a private event  , cannot send the request " })
            }
        }

        if (sender_id === creatorId) {
            return res.status(400).json({ message: "You cannot send a request to yourself" });
        }

        if (event.recivedRequest.includes(sender_id)) {
            return res.status(400).json({ message: "Request already sent" });
        }
        if (senderUser.receivedEventRequest.includes(sender_id)) {
            return res.status(400).json({ message: "Request already in the user array" });
        }
        const sendingRequest = await Event.findByIdAndUpdate(
            event__id,
            {
                $push:
                {
                    recivedRequest: sender_id,
                },
            }, { new: true }
        );
        if (!sendingRequest) {
            return res.status(400).json({ message: "error in sending request to the event " });
        };

        const updateSender = await User.findByIdAndUpdate(
            sender_id,
            {
                $push: {
                    sendEventConnectionRequest: event__id
                }
            },
            { new: true }


        );
        if (!updateSender) {
            return res.status(400).json({ message: "error in updating user  " });
        };
        const notificationVerification = await Notification.findOneAndUpdate(
            { user: obj_sender_id },
            {
                $push: {
                    notification: {
                        message: "YOU GOT EVENT CONNECTION REQUEST ",
                        type: "event", // Changed to match your schema enum
                        // isSeen will default to false as per your schema
                    },
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true // Ensures defaults are set on new documents
            }
        );

        if (!notificationVerification) {
            return res.status(400).json({ message: "request is been send but error in sending notificaion " })
        };

        return res.status(200).json({ message: "request is been send" });
    } catch (error) {
        console.log("ERROR", error);
        return res.status(400).json({ error: error });
    }
}
const unsendEventConnectionRequestByOtherUser = async (req, res) => {
    const sender_id = req.user._id;
    const event__id = req.body.eventId;

    try {
        const event = await Event.findById(event__id);
        // const isSenderBlockes = event.blockedUsers.includes(sender_id);
        const senderUser = await User.findById(sender_id);
        if (!senderUser) {
            return res.status(404).json({ message: "Sender not found" });
        }
        // if (isSenderBlockes) {
        //     return res.status(400).json({ message: "you cannnot send request to the event  contact the owner of the event " })
        // }

        if (!event.recivedRequest.includes(sender_id)) {
            return res.status(400).json({ message: "not in the receiver array " });
        }
        const sendingRequest = await Event.findByIdAndUpdate(
            event__id,
            {
                $pull:
                {
                    recivedRequest: sender_id,
                },
            }, { new: true }
        );
        if (!sendingRequest) {
            return res.status(400).json({ message: "error in unsending request to the event " });
        };

        const updateSender = await User.findByIdAndUpdate(
            sender_id,
            {
                $pull: {
                    sendEventConnectionRequest: event__id
                }
            },
            { new: true }


        );
        if (!updateSender) {
            return res.status(400).json({ message: "error in updating user  " });
        };

        return res.status(200).json({ message: "request is been unsend successfully " });
    } catch (error) {
        console.log("ERROR", error);
        return res.status(400).json({ error: error });
    }
}
const acceptEventConnectionRequest = async (req, res) => {
    const sender_id = req.body.senderId;
    const event__id = req.body.eventId;
    const obj_sender_id = new mongoose.Types.ObjectId(sender_id);

    try {
        const event = await Event.findById(event__id);
        const isSenderBlockes = event.blockedUsers.includes(sender_id);
        const senderUser = await User.findById(sender_id);
        if (!senderUser) {
            return res.status(404).json({ message: "Sender not found" });
        }
        const creatorId = event.createdBy;

        if (isSenderBlockes) {
            return res.status(400).json({ message: "you cannnot send request to the event  contact the owner of the event " })
        }

        if (!event.recivedRequest.includes(sender_id)) {
            return res.status(400).json({ message: "USER NOT FOUND IN THE REQUEST ARRAY " });
        }
        const acceptRequest = await Event.findByIdAndUpdate(event__id,
            {
                $pull:
                {
                    recivedRequest: sender_id,
                },
                $push:
                {
                    members: sender_id
                }
            },
            { new: true }
        )
        if (!acceptRequest) {
            return res.status(400), json({ message: "CANNOT ACCEPT THE REQUEST IN THE EVENTS  " });
        }
        const removingRequestUser = await User.findByIdAndUpdate(sender_id,
            {
                $pull:
                {
                    sendEventConnectionRequest: sender_id,
                },
                $push:
                {
                    connectedEvents: sender_id,
                }
            },
            { new: true }
        )

        await Notification.findOneAndUpdate(
            { user: obj_sender_id },
            {
                $push: {
                    notification: {
                        message: `your request has been accecpted `,
                        type: "event",
                    },
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true // Ensures defaults are set on new documents
            }
        );
        if (!removingRequestUser) {
            return res.status(400), json({ message: "CANNOT ACCEPT THE REQUEST IN THE USERS  " });
        } else {
            return res.status(200).json({ message: "successfully accecpted the request " });
        }





        return res.status(200).json({ message: "request is been unsend successfully " });
    } catch (error) {
        console.log("ERROR", error);
        return res.status(400).json({ error: error });
    }
}
const leaveEvent = async (req, res) => {
    const _id = req.user._id;
    const event__id = req.body.eventId;
    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(400), json({ message: "CANNOT FIND THE USER " });
        }

        const event = await Event.findById(event__id);
        if (!event) {
            return res.status(400), json({ message: "CANNOT FIND THE EVENT " });
        }

        const leaveEvent = await Event.findByIdAndUpdate(event__id,
            {
                pull: {
                    members: _id,
                }
            },
            { new: true }
        );
        if (leaveEvent) {
            return res.status(400), json({ message: "CANNOT REMOVE ID FROM  THE EVENT " });
        };

        const updateUser = await User.findByIdAndUpdate(_id,
            {
                $pull:
                {
                    connectedEvents: _id,
                }
            },
            { new: true }
        );

        if (!updateUser) {
            return res.status(400), json({ message: "CANNNOT UPDATE USER  " });
        }
        else {
            return res.status(200), json({ message: "successfully leaved the group " });
        }






    } catch (error) {
        console.log("ERROR IN GET REQUEST EVENTS ")
    }
}

module.exports = { createEvent, getMyEvents, updateEventInfo, deleteEvent, sendEventConnectionRequest, sendEventConnectionRequestByOtherUser, unsendEventConnectionRequestByOtherUser, leaveEvent, acceptEventConnectionRequest, unsendEventConnectionRequest };

