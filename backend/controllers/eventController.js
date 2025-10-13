const mongoose = require('mongoose')
const { ObjectId } = require('mongodb'); // or mongoose.mongo.ObjectId

const User = require('../models/User')

console.log('User import:', User);  // Should show Mongoose model functions
const Event = require('../models/event');
const Notification = require('../models/notification');
const { findByIdAndUpdate } = require('../models/channel');
const { CgOpenCollective } = require('react-icons/cg');
const createEvent = async (req, res) => {
    const _id = req.user._id;
    console.log("Creating event for user:", _id);

    // Destructure all required fields from request body
    const {
        name,
        description,
        isPrivate = false,
        eventDate,
        location,
        applicationDeadline,
        isLimitedMemberEvent = false,
        totalMembersAllowed = 10
    } = req.body;

    try {
        // Validate required fields
        if (!name || !eventDate || !applicationDeadline) {
            return res.status(400).json({
                message: 'Missing required fields: name, eventDate, and applicationDeadline are required'
            });
        }

        // Validate dates
        if (new Date(applicationDeadline) >= new Date(eventDate)) {
            return res.status(400).json({
                message: 'Application deadline must be before the event date'
            });
        }

        // Validate member limit if enabled
        if (isLimitedMemberEvent && (!totalMembersAllowed || totalMembersAllowed < 1)) {
            return res.status(400).json({
                message: 'Member limit must be at least 1 when enabled'
            });
        }

        // Check if user exists
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for duplicate event names (case insensitive)
        const existingEvent = await Event.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            createdBy: _id
        });

        if (existingEvent) {
            return res.status(400).json({
                message: "You already have an event with this name"
            });
        }

        // Create the new event
        const newEvent = await Event.create({
            name,
            description,
            isPrivate,
            createdBy: _id,
            location,
            eventDate,
            applicationDeadline,
            isLimitedMemberEvent,
            totalMembersAllowed: isLimitedMemberEvent ?
                Math.max(1, totalMembersAllowed) :
                -1,
            members: [_id],
            sendRequest: [],
            blockedUsers: [],
            recivedRequest: [],
            messages: [],
            isDelete: false
        });

        // Update user with the new event reference
        const updatedUser = await User.findByIdAndUpdate(
            _id,
            {
                $push: {
                    events: newEvent._id,
                    connectedEvents: newEvent._id
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            // Rollback event creation if user update fails
            await Event.findByIdAndDelete(newEvent._id);
            return res.status(400).json({
                message: "Failed to update user with new event"
            });
        }

        return res.status(201).json({
            message: "Event created successfully",
            event: newEvent
        });

    } catch (error) {
        console.error("Error creating event:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};
const getMyEvents = async (req, res) => {
    const _id = req.user._id;

    try {
        // Deep populate connectedEvents and their recivedRequest
        const data = await User.findById(_id)
            .populate({
                path: 'connectedEvents',
                populate: {
                    path: 'recivedRequest', 
                    select: '_id name email', // optional: limit fields
                },
            })
            .select('connectedEvents');

        if (!data) {
            return res.status(400).json({ error: "Error in fetching data" });
        }

        const currentDate = new Date();

        // Filter upcoming events only
        const upcomingEvents = data.connectedEvents.filter(event => {
            return new Date(event.eventDate) > currentDate;
        });

        res.status(200).json({
            events: {
                ...data.toObject(),
                connectedEvents: upcomingEvents,
            },
        });

    } catch (error) {
        console.error("Error in getMyEvents:", error);
        res.status(400).json({ error: error.message });
    }
};

// const getMyPastEvents = async (req, res) => {
//     const _id = req.user._id;
//     try {
//         const data = await User.findById(_id)
//             .populate('connectedEvents')
//             .select('connectedEvents');

//         if (!data) {
//             return res.status(400).json({ error: "Error in fetching data" });
//         }

//         // Get current date/time
//         const currentDate = new Date();
//         console.log("data in the getMyEvent", data);
//         // Filter out past events
//         const upcomingEvents = data.connectedEvents.filter(event => {
//             return new Date(event.eventDate) < currentDate;
//         });

//         res.status(200).json({
//             events: {
//                 ...data.toObject(),
//                 connectedEvents: upcomingEvents
//             }
//         });

//     } catch (error) {
//         res.status(400).json({ error: error.message }); // Better to send error.message
//     }
// }

const getEventRequests = async (req, res) => {
    const _id = req.user._id;
    try {
        const data = await User.findById(_id)
            .select('receivedEventConnectionRequest')
            .populate('receivedEventConnectionRequest'); // Model is inferred from schema
        // const data = await User.findById(_id).select('receivedEventConnectionRequest').populate('receivedEventConnectionRequest');
        if (!data) {
            res.status(400).json({ error: "error in fetching data" })
        }
        res.status(200).json({ eventRequests: data });

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
    const event__id = req.body.eventId; // Channel ID to delete
    const obj_event_id = new mongoose.Types.ObjectId(event__id);

    try {
        const event = await Event.findById(event__id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
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


        // removing Events from all the users 
        for (const member of ev.members) {

            await User.findByIdAndUpdate(member,
                { $pull: { connectedEvents: event__id } });

        }

        // removing the Event id from the user 
        const updatedUser = await User.findByIdAndUpdate(
            _id,
            {
                $pull: {
                    events: { _id: event__id },
                    connectedEvents: event__id
                }
            },
            { new: true }
        );



        if (!updatedUser) {
            return res.status(400).json({ message: 'Failed to update user' });
        }


        // Delete the channel from the Channel collection
        const deletedChannel = await Event.findByIdAndUpdate(event__id, {
            isDelete: true,
        });
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
//creator send request to other user
const sendEventConnectionRequest = async (req, res) => {
    const _id = req.user._id;
    const event__id = req.body.eventId;
    const sender_id = req.body.senderId;
    const obj_sender_id = new mongoose.Types.ObjectId(sender_id);
    try {

        const user = await User.findById(_id);
        const event = await Event.findById(event__id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (event.recivedRequest.includes(sender_id)) {
            return res.status(400).json({ message: "ALREADY HAVE REQUEST TO YOUR ACCOUNT " })
        }

        if (event.isPrivate) {
            if (user.connections.some(connection => connection.friend.$oid === sender_id)) {
                return res.status(400).json({ message: "this is a private event  , cannot send the request " })
            }
        }

        const check1 = event.members.includes(sender_id);
        if (check1) {
            return res.status(400).json({ message: "already member of this channel" });
        }
        if (event.blockedUsers.includes(_id)) {
            return res.status(400).json({ message: "CANNOT SEND THE REQUEST " })
        }
        const creatorId = event.createdBy;

        console.log("creator and id", creatorId, "    ", _id)
        if (_id.toString() != creatorId.toString()) {
            return res.status(400).json({ message: "ONLY CREATOR CAN REJECT THE REQUEST" });
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
            { $push: { receivedEventConnectionRequest: event__id } }, // Corrected spelling
            { new: true }
        );

        if (!updatedSender) {
            return res.status(400).json({ message: "Failed to update sender's request list" });
        }
        const updatedUser = await User.findByIdAndUpdate(
            sender_id,
            { $push: { receivedEventConnectionRequest: event__id } }, // Corrected spelling
            { new: true }
        );

        if (!updatedUser) {
            return res.status(400).json({ message: "Failed to update users's request list" });
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
//creator unsend the event connection request 
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

        const creatorId = event.createdBy;
        if (_id.toString() != creatorId.toString()) {
            return res.status(400).json({ message: "ONLY CREATOR CAN REJECT THE REQUEST" });
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
            { $pull: { receivedEventConnectionRequest: event__id } },
            { new: true }
        );

        if (!updatedSender) {
            return res.status(400).json({ message: "Failed to update sender's request list" });
        }

        return res.status(200).json({ message: "Request unsent successfully" });
    } catch (error) {
        console.error("Error sending channel connection request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
// other user send request to event
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
            return res.status(404).json({ message: " SENDER IS BLOCKED " });
        }
        const creatorId = event.createdBy;
        if (senderUser.receivedEventConnectionRequest.includes(event__id)) {
            return res.status(400).json({ message: "ALREADY HAVE REQUEST TO YOUR ACCOUNT " });
        }
        if (event.members.includes(sender_id)) {
            return res.status(400).json({ message: "ALREADY MEMBER OF THE EVENT " });
        }
        if (event.isPrivate) {
            if (!senderUser.connections.includes(sender_id)) {
                return res.status(400).json({ message: "this is a private event  , cannot send the request " })
            }
        }
        if (isSenderBlockes) {
            return res.status(400).json({ message: "you cannnot send request to the event  contact the owner of the event " })
        }

        if (sender_id === creatorId) {
            return res.status(400).json({ message: "You cannot send a request to yourself" });
        }

        if (event.recivedRequest.includes(sender_id)) {
            return res.status(400).json({ message: "Request already sent" });
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
        const updateUser = await User.findByIdAndUpdate(
            creatorId,
            {
                $push: {
                    receivedEventConnectionRequest: sender_id
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
//unsend the request to the event which is send by other user 
const unsendEventConnectionRequestByOtherUser = async (req, res) => {
    const sender_id = req.user._id;
    const event__id = req.body.eventId;

    try {
        const event = await Event.findById(event__id);
        // const isSenderBlockes = event.blockedUsers.includes(sender_id);
        const senderUser = await User.findById(sender_id);
        const creatorId = event.creatorId;
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

        // const updatingCreator = await User.findByIdAndUpdate(creatorId,
        //     {
        //         $pull: {
        //             receivedEventConnectionRequest:sender_id,                   
        //         }
        //     })

        // if(!updatingCreator)
        // {
        //     return res.status(400).json({ message: "error in updating user  " });
        // }

        return res.status(200).json({ message: "request is been unsend successfully " });
    } catch (error) {
        console.log("ERROR", error);
        return res.status(400).json({ error: error });
    }
}
// this accecpt the reqquest send by the other-user( creator side ) 
const acceptEventConnectionRequestSendByOtherUser = async (req, res) => {
    const sender_id = req.body.senderId;
    const event__id = req.body.eventId;
    const _id = req.user._id;
    const obj_sender_id = new mongoose.Types.ObjectId(sender_id);
    try {
        const user = await User.findById(sender_id);
        const self = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: "USER IS NOT FOUND" });
        }
        const event = await Event.findById(event__id);

        if (!event) {
            return res.status(404).json({ message: "EVENT IS NOT FOUND" });
        }
        if (!event.recivedRequest.includes(sender_id)) {
            return res.status(404).json({ message: "REQUEST IS NOT FOUND " });

        }




        const acceptInEvent = await Event.findByIdAndUpdate(event__id, {
            $pull: {
                recivedRequest: sender_id
            },
            $push: { members: sender_id },
        });
        if (!acceptInEvent) {
            return res.status(407).json({ message: "CANNOT ACCEPT THE REQUEST IN EVENT " });
        }

        const acceptInUser = await User.findByIdAndUpdate(sender_id,
            {
                $pull: {
                    sendEventConnectionRequest: event__id,
                },
                $push: {
                    connectedEvents: event__id
                }
            },
            { new: true });

        if (!acceptInUser) {
            return res.status(400).json({ message: "ERROR IN ACCECPTING THE REQUEST IN USER " });
        }

        const updatingUser = await User.findByIdAndUpdate(_id,
            {
                $pull: { receivedEventConnectionRequest: sender_id },
                $push: { connectedEvents: event__id }
            }
        )
        if (!updatingUser) {
            return res.status(400).json({ message: "ERROR IN UPDATING USER " });
        }
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
        return res.status(200).json({ message: "successfully accecpted the request " })
    } catch (error) {
        console.log("ERROR ", error);
        return res.json(500).json({ error: error });

    }
}
//this accecpt the reques which is send by creator 
const acceptEventConnectionRequestSendByCreator = async (req, res) => {
    const sender_id = req.body.senderId;
    const event__id = req.body.eventId;
    const _id = req.user._id;
    const obj_sender_id = new mongoose.Types.ObjectId(sender_id);

    try {
        const self = await User.findById(_id);
        const event = await Event.findById(event__id);

        if (!event) {
            return res.status(404).json({ message: "EVENT IS NOT FOUND" });
        }

        if (!self.receivedEventConnectionRequest.includes(event__id)) {
            return res.status(404).json({ message: "REQUEST IS NOT FOUND" });
        }

        if (self.connectedEvents.includes(event__id)) {
            return res.status(200).json({ message: "ALREADY MEMBER OF THE EVENT" });
        }


        const acceptInEvent = await Event.findByIdAndUpdate(event__id, {
            $pull: {
                sendRequest: _id
            },
            $push: {
                members: _id
            },
        }, { new: true });

        if (!acceptInEvent) {
            return res.status(400).json({ message: "CANNOT ACCEPT THE REQUEST IN EVENT" });
        }


        const updatedUser = await User.findByIdAndUpdate(_id, {
            $pull: {
                receivedEventConnectionRequest: event__id,

                // receivedEventConnectionRequest: { $in: [event__id, sender_id] }
            },
            $addToSet: {
                connectedEvents: event__id
            }
        }, { new: true });

        if (!updatedUser) {
            return res.status(400).json({ message: "ERROR IN UPDATING USER" });
        }

        // Send notification to sender
        await Notification.findOneAndUpdate(
            { user: obj_sender_id },
            {
                $push: {
                    notification: {
                        message: `Your request has been accepted`,
                        type: "event",
                        eventId: event__id,
                        timestamp: new Date()
                    },
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            message: "Successfully accepted the request",
            event: acceptInEvent,
            user: updatedUser
        });
    } catch (error) {
        console.log("ERROR ", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
//reject event connect request which is being send by the other user 
const rejectEventConnectionRequestSendByOtherUser = async (req, res) => {
    const sender_id = req.body.senderId;
    const event__id = req.body.eventId;
    const _id = req.user._id;
    const obj_sender_id = new mongoose.Types.ObjectId(sender_id);
    try {
        const user = await User.findById(sender_id);
        const self = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: "USER IS NOT FOUND" });
        }
        const event = await Event.findById(event__id);

        if (!event) {
            return res.status(404).json({ message: "EVENT IS NOT FOUND" });
        }
        // console.log("_id",_id,"createdBy",event.createdBy);
        const createdBy = event.createdBy;
        if (_id.toString() != createdBy.toString()) {
            return res.status(400).json({ message: "ONLY CREATOR CAN REJECT THE REQUEST" });
        }
        if (!user.receivedEventConnectionRequest.includes(event__id)) {
            return res.status(400).json({ message: "REQUEST NOT FOUND IN USER " })
        }



        // const rejectInUser = await User.findByIdAndUpdate(_id, {
        //     $pull: {
        //         receivedEventRequest: sender_id
        //     },
        //     $push: { members: _id },
        // });
        const updateEvent = await Event.findByIdAndUpdate(event__id, {
            $pull: {
                recivedRequest: sender_id,
            }
        });
        if (!updateEvent) {
            return res.status(400).json({ message: "NOT UPDATE THE EVENT" })
        }
        // if (!rejectInUser) {
        //     return res.status(404).json({ message: "CANNOT ACCEPT THE REQUEST IN EVENT " });
        // }

        const rejectInOtherUser = await User.findByIdAndUpdate(sender_id,
            {
                $pull: {
                    sendEventConnectionRequest: event__id,
                }
            },
            { new: true });

        if (!rejectInOtherUser) {
            return res.status(400).json({ message: "ERROR IN REJECTING THE REQUEST IN USER " });
        }

        const updatingUser = await User.findByIdAndUpdate(_id,
            {
                $pull: { receivedEventConnectionRequest: sender_id }
            }
        )
        if (!updatingUser) {
            return res.status(400).json({ message: "ERROR IN UPDATING USER " });
        }
        await Notification.findOneAndUpdate(
            { user: obj_sender_id },
            {
                $push: {
                    notification: {
                        message: `your request has been REJECTED `,
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
        return res.status(200).json({ message: "successfully rejected  the request " })
    } catch (error) {
        console.log("ERROR ", error);
        return res.json(500).json({ error: error });

    }
}
//reject event connection request send by the creator 
const rejectEventConnectionRequestSendByCreator = async (req, res) => {
    const _id = req.user._id;
    // const sender_id = req.body.senderId;
    const event__id = req.body.eventId;
    try {
        const user = await User.findById(_id);
        const event = await Event.findById(event__id);
        const creatorId = event.createdBy;
        if (!user) {
            return res.status(400).json({ message: "USER NOT FOUND " });
        }

        if (!event) {
            return res.staus(400).json({ message: "EVENT IS NOT FOUND " });
        }

        if (!user.receivedEventConnectionRequest.includes(event__id)) {
            return res.status(400).json({ message: "REQUEST IS NOT FOUND " })
        }

        const updateUser = await User.findByIdAndUpdate(_id,
            {
                $pull:
                {
                    receivedEventConnectionRequest: event__id
                }
            }
        )

        if (!updateUser) {
            return res.status(400).json({ message: "CANNOT REMOVE THE REQUEST FORM THE USER " })
        }

        const updateEvent = await Event.findByIdAndUpdate(event__id,
            {
                $pull: {
                    sendRequest: _id,
                }
            }
        );

        if (!updateEvent) {
            return res.status(400).json({ message: "CANNOT UPDATE THE EVENT " });
        }

        // const updateCreator = await User.findByIdAndUpdate(creatorId,
        //     {
        //         $pull:{
        //             sendEventConnectionRequest:_id
        //         }
        //     }
        // );
        // if(!updateCreator)
        // {
        //     return res.status(400).json({message:"CANNOT UPDATE THE CREATOR "})
        // }

        await Notification.findOneAndUpdate(
            { user: creatorId },
            {
                $push: {
                    notification: {
                        message: `your request has been rejeceted `,
                        type: "event",
                    },
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );


        return res.status(200).json({ message: "request is successfully rejected " });

    } catch (error) {
        console.log("error ", error);
        return res.status(500).json({ error: error });

    }
}
//get list for user who send the request to a event 
const getEventConnectionRequestListToEvents = async (req, res) => {
    const _id = req.user._id;
    const event__id = req.body.eventId;
    try {
        const data = await Event.findById(event__id).select("recivedRequest ").populate("recivedRequest")
        return res.status(200).json({ message: "successfull get the data", data: data })
    } catch (error) {
        console.log("ERROR IN GET REQUEST EVENTS ")
        return res.status(500).json({ error: error })
    }
}
//get the list of event request a user get 
const getEventConnectionRequestListToUser = async (req, res) => {
    const _id = req.user._id;

    try {
        const data = await User.findById(_id).select("receivedEventConnectionRequest email").populate("receivedEventConnectionRequest")

        return res.status(200).json({ message: "successfull get the data", data: data })
    } catch (error) {
        console.log("ERROR IN GET REQUEST EVENTS ")
        return res.status(500).json({ error: error })
    }
}
// leave the event
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
            return res.status(400).json({ message: "CANNOT FIND THE EVENT " });
        }
        const createdId = event.createdBy;

        if (_id.toString() === createdId.toString()) {
            return res.status(400).json({ message: "YOU  ARE CREATOR OF THE EVENT " });
        }

        if (!user.connectedEvents.includes(event__id)) {
            return res.status(400).json({ message: "YOU ARE NOT CONNECTED TO THIS EVENT " });
        }
        console.log("the event id and _id is", event__id, _id);
        const leaveEvent = await Event.findByIdAndUpdate(event__id,
            {
                $pull: {
                    members: _id,
                }
            },
            { new: true }
        )
        console.log("after leave event ", leaveEvent);
        if (!leaveEvent) {
            return res.status(400).json({ message: "CANNOT REMOVE ID FROM  THE EVENT " });
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
            return res.status(400).json({ message: "CANNNOT UPDATE USER  " });
        }
        else {
            return res.status(200).json({ message: "successfully leaved the group " });
        }






    } catch (error) {
        console.log("ERROR IN GET REQUEST EVENTS ", error)
        return res.status(500).json({ error: error })
    }
}
const getConnectionForEventConnectionRequest = async (req, res) => {
    const self_id = req.user._id;
    const eventId = req.params.eventId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(self_id) || !mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid ID(s)." });
        }

        // Get current user's connections and received requests
        const currentUser = await User.findById(self_id)
            .select("connections receivedEventConnectionRequest");
        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found." });
        }

        // Get non-blocked friend IDs
        const friendIds = currentUser.connections
            .filter(connection => !connection.isBlocked)
            .map(connection => connection.friend);

        console.log("friends is ", friendIds);
        // Pagination setup
        const skip = (page - 1) * limit;

        // Main query for friends who can receive event connection requests
        const friendsQuery = {
            _id: { $in: friendIds },
            receivedEventConnectionRequest: { $ne: eventId },
            connectedEvents: { $ne: eventId }
        };

        const friends = await User.find(friendsQuery)
            .select("username name")
            .skip(skip)
            .limit(limit);

        console.log("friends", friends);

        // Count total matching friends
        const totalFriends = await User.countDocuments(friendsQuery);

        // Get users who have sent event connection requests to current user
        const followRequest = await User.find({
            _id: { $in: currentUser.receivedEventConnectionRequest }
        }).select("username name");

        const totalPages = Math.ceil(totalFriends / limit);

        res.status(200).json({
            message: "List of connections fetched successfully.",
            friends,
            followRequest,
            pagination: {
                currentPage: page,
                totalPages,
                totalResults: totalFriends,
                resultsPerPage: limit,
            },
        });
    } catch (error) {
        console.error("ERROR FETCHING CONNECTIONS:", error);
        res.status(500).json({ message: "Cannot fetch connections.", error: error.message });
    }
};
const getSuggestionsForEventConnectionRequest = async (req, res) => {
    const self_id = req.user._id;
    const eventId = req.params.eventId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(self_id) || !mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid ID(s)." });
        }

        // Get current user's connections and received requests
        const currentUser = await User.find()
        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found." });
        }

        // Get non-blocked friend IDs
        const friendIds = currentUser
            .filter(connection => !connection.isBlocked)
            .map(connection => connection.friend);

        // Pagination setup
        const skip = (page - 1) * limit;

        // Main query for friends who can receive event connection requests
        const friendsQuery = {
            _id: { $nin: friendIds },
            receivedEventConnectionRequest: { $ne: eventId },
            connectedEvents: { $ne: eventId }
        };

        const friends = await User.find(friendsQuery)
            .select("username name")
            .skip(skip)
            .limit(limit);

        console.log("friends", friends);

        // Count total matching friends
        const totalFriends = await User.countDocuments(friendsQuery);

        // Get users who have sent event connection requests to current user
        const followRequest = await User.find({
            _id: { $in: currentUser.receivedEventConnectionRequest }
        }).select("username name");

        const totalPages = Math.ceil(totalFriends / limit);

        res.status(200).json({
            message: "List of connections fetched successfully.",
            friends,
            followRequest,
            pagination: {
                currentPage: page,
                totalPages,
                totalResults: totalFriends,
                resultsPerPage: limit,
            },
        });
    } catch (error) {
        console.error("ERROR FETCHING CONNECTIONS:", error);
        res.status(500).json({ message: "Cannot fetch connections.", error: error.message });
    }
};
const getDiscoverEvents = async (req, res) => {
    const _id = req.user._id;
    try {
        const userEvents = await Event.find({ members: _id }).select('_id');
        const userEventsIds = userEvents.map(ch => ch._id);
        const data = await Event.aggregate([
            {
                $match: {
                    createdBy: { $ne: _id },
                    _id: { $nin: userEventsIds },
                    isPrivate: false,
                    isDelete: false,
                    applicationDeadline: { $gte: new Date() },
                    $expr: {
                        $or: [
                            // Include unlimited member events
                            { $eq: ["$isLimitedMemberEvent", false] },
                            // OR limited events that haven't reached capacity
                            {
                                $and: [
                                    { $eq: ["$isLimitedMemberEvent", true] },
                                    { $lt: [{ $size: "$members" }, "$totalMembersAllowed"] }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    receiveRequest: { $ifNull: ["$recivedRequest", []] },
                    alreadySend: {
                        $cond: {
                            if: { $in: [_id, "$recivedRequest"] },
                            then: true,
                            else: false
                        }
                    },
                    // Add a field to show available spots if limited
                    availableSpots: {
                        $cond: {
                            if: { $eq: ["$isLimitedMemberEvent", true] },
                            then: { $subtract: ["$totalMembersAllowed", { $size: "$members" }] },
                            else: "Unlimited"
                        }
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    alreadySend: 1,
                    eventDate: 1,
                    applicationDeadline: 1,
                    location: 1,
                    isLimitedMemberEvent: 1,
                    totalMembersAllowed: 1,
                    membersCount: { $size: "$members" },
                    availableSpots: 1
                }
            }
        ]);


        return res.status(200).json({ message: "successfully get the data ", data: data })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Cannot fetch events.", error: error.message });


    }
}
const blockUserEvent = async (req, res) => {

    try {
        const userId = req.user._id;
        console.log("the request is ", req.body.eventId, req.body.otherUserId);
        const { eventId, otherUserId } = req.body;

        const obj_event_id = new ObjectId(eventId);
        const obj_sender_id = new ObjectId(otherUserId);



        const event = await Event.findById(eventId);
        const otherUser = await User.findById(otherUserId)
        console.log("the event and user  ", event, otherUser)
        if (otherUser.equals(userId)) {
            return res.status(403).json({ message: "you cant block yourself " })
        }
        if (!event) {
            return res.status(400).json({ message: "the event is not found " })
        }
        if (!eventId) {
            console.log("user  not found.")
            return res.status(404).json({ message: "Event not found." });
        }
        if (!otherUser) {
            console.log("user  not found.")
            return res.status(404).json({ message: "user  not found." });
        }

        if (!event.createdBy.equals(userId)) {
            return res.status(403).json({
                message: "You can't block an event you didn't have authority to block."
            });
        }
        if (event.blockedUsers.includes(otherUserId)) {
            return res.status(400).json({ message: "already blocked" });
        }
        event.blockedUsers.push(otherUserId);
        event.members.pull(otherUserId)
        otherUser.blockEvents.push(eventId);
        await otherUser.save();
        await event.save();
        res.status(200).json({ message: "User blocked successfully." });


    } catch (error) {
        console.log("the error is ", error)
        res.status(500).json({ error: error })
    }
}
const unblockUserEvent = async (req, res) => {

    try {
        const userId = req.user._id; // The user making the request (event owner)
        const { eventId, otherUserId } = req.body;

        // Validate input
        if (!eventId || !otherUserId) {
            return res.status(400).json({ message: "eventId and otherUserId are required" });
        }

        // Convert to ObjectId
        const eventObjId = new ObjectId(eventId);
        const otherUserObjId = new ObjectId(otherUserId);

        // Find the event and user
        const event = await Event.findById(eventObjId);
        const otherUser = await User.findById(otherUserObjId);

        // Check if they exist
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if (!otherUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the requester is the event owner
        if (!event.createdBy.equals(userId)) {
            return res.status(403).json({
                message: "Only the event owner can unblock users"
            });
        }

        // Check if the user is actually blocked
        if (!event.blockedUsers.includes(otherUserObjId)) {
            return res.status(400).json({ message: "User is not blocked" });
        }

        // Remove from blockedUsers array (event side)
        event.blockedUsers = event.blockedUsers.filter(id => !id.equals(otherUserObjId));

        // Remove from blockEvents array (user side)
        otherUser.blockEvents = otherUser.blockEvents.filter(id => !id.equals(eventObjId));

        // Save changes
        await Promise.all([event.save(), otherUser.save()]);

        return res.status(200).json({ message: "User unblocked successfully" });

    } catch (error) {
        console.error("Unblock error:", error);
        return res.status(500).json({
            error: error.message || "Internal server error"
        });
    }
};

const removeUserFromEvent = async (req, res) => {
    try {
        const userId = req.user._id;
        const eventId = req.body.eventId;
        const otherUserId = req.body.otherUserId;
        const otherUserObjId = new ObjectId(otherUserId);
        const eventObjectId = new ObjectId(eventId);
        const event = await Event.findById(eventId);
        const otherUser = await User.findById(otherUserObjId);

        if (!event) {
            return res.status(403).json({ message: "Event not found" });
        }

        if (!userId.equals(event.createdBy)) {
            return res.status(401).json({ message: "you are not the owner of the event" })
        }

        if (userId.equals(otherUserObjId)) {
            return res.status(401).json({ message: "you can`t remve yourself from the event " })
        }

        if (!event.members.includes(otherUserObjId)) {
            return res.status(401).json({ message: "not the member of the event " })
        }


        if (!await User.findById(userId)) {
            return res.status(403).json({ message: "User not found" });
        }

        event.members = event.members.filter(id => !id.equals(otherUserObjId));
        otherUser.connectedEvents = otherUser.connectedEvents.filter(id => !id.equals(eventObjectId));
        await event.save();
        await otherUser.save();
        return res.status(200).json({ message: "successfully removes the user from the event" })


    } catch (error) {
        console.log(error)
        return res.stsus(500).json({ messsage: "internal server error " })
    }
}
const getConnectedUsersEvent = async (req, res) => {
    const eventId = req.body.eventId;
    const userId = req.body.userId;
    try {
        const event = await Event.findById(eventId)
            .populate({
                path: 'members',
                select: 'name username',
                model: 'User'
            }).select("members");

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if (event.members.includes(userId)) {
            return res.status(200).json({ message: "not the member of the event" });
        }
        return res.status(200).json({
            message: "successfuly get the event  connected users",
            users: event
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "intetnal server error" })

    }
}

const getBlockUserOfEvent = async (req, res) => {
    const { eventId } = req.body;
    const objEventId = new ObjectId(eventId);

    const userId = req.user._id;
    try {
        const event = await Event.findById(objEventId).populate({
            path: 'blockedUsers',
            select: 'name email _id'
        }).select("blockedUsers")

        if (userId.equals(event.createdBy)) {
            return res.status(403).json({ message: "you are not the creator of the channel " })
        }
        if (!event) {
            return res.staus(403).json({ message: "channel not found " })
        }
        return res.status(200).json({
            message: "successfully get the block users",
            data: event
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "internal server error" })

    }
}

const getEventInfo = async (req, res) => {
    const eventId = req.query.eventId;
    const userId = req.user._id;
    const objEventId = new ObjectId(eventId);
    console.log("in the get event info ", eventId, userId)

    try {
        const event = await Event.findById(eventId).populate({
            path: 'members',
            select: 'name members description createdBy eventDate location -_id',
            model: 'User'
        })
            .select("members createdBy description eventDate location -_id");


        if (event.members.includes(userId)) {
            return res.status(403).json({ message: "not the member of the channel" });
        }
        return res.status(200).json({ message: "successfully get the channel", data: event });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "internal server error " })
    }
}


module.exports = {
    createEvent, getMyEvents, updateEventInfo,
    deleteEvent, sendEventConnectionRequest, sendEventConnectionRequestByOtherUser
    , unsendEventConnectionRequestByOtherUser, leaveEvent,
    unsendEventConnectionRequest, acceptEventConnectionRequestSendByOtherUser,
    rejectEventConnectionRequestSendByOtherUser, rejectEventConnectionRequestSendByCreator,
    getEventConnectionRequestListToEvents, getEventConnectionRequestListToUser,
    acceptEventConnectionRequestSendByCreator, getEventRequests, getConnectionForEventConnectionRequest,
    getSuggestionsForEventConnectionRequest, getDiscoverEvents, blockUserEvent,
    unblockUserEvent, getConnectedUsersEvent, removeUserFromEvent, getBlockUserOfEvent, getEventInfo,
};

