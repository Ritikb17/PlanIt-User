const mongoose = require('mongoose')
const User = require('../models/User')

console.log('User import:', User);  // Should show Mongoose model functions
const Event = require('../models/event');
const Notification = require('../models/notification');
const { findByIdAndUpdate } = require('../models/channel');
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
                { 
                    $push: { 
                        events: newEvent._id,
                        connectedEvents: newEvent._id 
                    } 
                },
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
const getEventRequests = async (req, res) => {
    const _id = req.user._id;
    try {
        const data = await User.findById(_id)
  .select('receivedEventConnectionRequest')
  .populate({
    path: 'receivedEventConnectionRequest',
    model: 'Event'  
  });
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
            { $pull: { events: { _id: event__id } ,
        connectedEvents:event__id} },
            { new: true }
        );



        if (!updatedUser) {
            return res.status(400).json({ message: 'Failed to update user' });
        }


        // Delete the channel from the Channel collection
        const deletedChannel = await Event.findByIdAndUpdate(event__id,{
            isDelete:true,
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

        if(event.recivedRequest.includes(sender_id))
        {
            return res.status(400).json({message:"ALREADY HAVE REQUEST TO YOUR ACCOUNT "})
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
        const creatorId = event.createdBy;

        console.log("creator and id",creatorId,"    ",_id)
        if (_id.toString() != creatorId.toString()) {
            return res.status(400).json({message: "ONLY CREATOR CAN REJECT THE REQUEST"});
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
            { $push: { sendEventConnectionRequest: sender_id } },
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
            return res.status(400).json({message: "ONLY CREATOR CAN REJECT THE REQUEST"});
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
        if(!event.recivedRequest.includes(sender_id))
        {
            return res.status(404).json({ message: "REQUEST IS NOT FOUND " });
 
        }




        const acceptInEvent = await Event.findByIdAndUpdate(event__id, {
            $pull: {
                recivedRequest:sender_id
            },
            $push: { members: sender_id },
        });
        if (!acceptInEvent) {
            return res.status(407).json({ message: "CANNOT ACCEPT THE REQUEST IN EVENT " });
        }

        const acceptInUser = await User.findByIdAndUpdate(sender_id, 
            {
                $pull: {
                    sendEventConnectionRequest:event__id,
                },
                $push:{
                    connectedEvents:event__id
                }
            },
            {new:true});

        if(!acceptInUser)
        {
            return res.status(400).json({message:"ERROR IN ACCECPTING THE REQUEST IN USER "});
        }

        const updatingUser = await User.findByIdAndUpdate(_id,
            {
                $pull: {receivedEventConnectionRequest:sender_id},
                $push: { connectedEvents: event__id }
            }
        )
        if(!updatingUser)
        {
            return res.status(400).json({message:"ERROR IN UPDATING USER "});
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
        return res.status(200).json({message:"successfully accecpted the request "})
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
        // const user = await User.findById(sender_id);
        const self = await User.findById(_id);
        // if (!user) {
        //     return res.status(404).json({ message: "USER IS NOT FOUND" });
        // }
        const event = await Event.findById(event__id);

        if (!event) {
            return res.status(404).json({ message: "EVENT IS NOT FOUND" });
        }
        if(!self.receivedEventConnectionRequest.includes(event__id))
        {
            return res.status(404).json({ message: "REQUEST IS NOT FOUND " });
 
        }
        if(self.connectedEvents.includes(event__id))
        {
            return res.status(200).json({message:"ALREADY MEMBER OF THE EVENT "});
        }

        const acceptInEvent = await Event.findByIdAndUpdate(event__id, {
            $pull: {
                sendRequest:_id
            },
            $push: { members: _id },
        });
        if (!acceptInEvent) {
            return res.status(407).json({ message: "CANNOT ACCEPT THE REQUEST IN EVENT " });
        }

        // const acceptInUser = await User.findByIdAndUpdate(_id, 
        //     {
        //         $pull: {
        //             receivedEventConnectionRequest:event__id,
        //         },
        //         $push:{
        //             connectedEvents:event__id
        //         }
        //     },
        //     {new:true});

        // if(!acceptInUser)
        // {
        //     return res.status(400).json({message:"ERROR IN ACCECPTING THE REQUEST IN USER "});
        // }

        const updatingUser = await User.findByIdAndUpdate(_id,
            {
                $pull: {receivedEventConnectionRequest:sender_id},
                $push: { connectedEvents: event__id }
            }
        )
        if(!updatingUser)
        {
            return res.status(400).json({message:"ERROR IN UPDATING USER "});
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
        return res.status(200).json({message:"successfully accecpted the request "})
    } catch (error) {
        console.log("ERROR ", error);
        return res.json(500).json({ error: error });

    }
}
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
            return res.status(400).json({message: "ONLY CREATOR CAN REJECT THE REQUEST"});
        }
        if(!user.receivedEventConnectionRequest.includes(event__id))
        {
            return res.status(400).json({message:"REQUEST NOT FOUND IN USER "})
        }



        // const rejectInUser = await User.findByIdAndUpdate(_id, {
        //     $pull: {
        //         receivedEventRequest: sender_id
        //     },
        //     $push: { members: _id },
        // });
        const updateEvent = await Event.findByIdAndUpdate(event__id, {
            $pull: {
                recivedRequest:sender_id,
            }
        });
        if(!updateEvent)
        {
            return res.status(400).json({message:"NOT UPDATE THE EVENT"})
        }
        // if (!rejectInUser) {
        //     return res.status(404).json({ message: "CANNOT ACCEPT THE REQUEST IN EVENT " });
        // }

        const rejectInOtherUser = await User.findByIdAndUpdate(sender_id, 
            {
                $pull: {
                    sendEventConnectionRequest:event__id,
                }
            },
            {new:true});

        if(!rejectInOtherUser)
        {
            return res.status(400).json({message:"ERROR IN REJECTING THE REQUEST IN USER "});
        }

        const updatingUser = await User.findByIdAndUpdate(_id,
            {
                $pull: {receivedEventConnectionRequest:sender_id}
            }
        )
        if(!updatingUser)
        {
            return res.status(400).json({message:"ERROR IN UPDATING USER "});
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
        return res.status(200).json({message:"successfully rejected  the request "})
    } catch (error) {
        console.log("ERROR ", error);
        return res.json(500).json({ error: error });

    }
}
//reject event connection request send by the creator 
const rejectEventConnectionRequestSendByCreator = async ( req,res)=>
{
    const _id = req.user._id;
    // const sender_id = req.body.senderId;
    const event__id = req.body.eventId;
    try {
        const user = await User.findById(_id);
        const event =await Event.findById(event__id);
        const creatorId = event.createdBy;
        if(!user)
        {
            return res.status(400).json({message:"USER NOT FOUND "});
        }

        if(!event)
        {
            return res.staus(400).json({message:"EVENT IS NOT FOUND "});
        }

        if(!user.receivedEventConnectionRequest.includes(event__id))
        {
            return res.status(400).json({message:"REQUEST IS NOT FOUND "})
        }

        const updateUser = await User.findByIdAndUpdate(_id,
            {
                $pull:
                {
                    receivedEventConnectionRequest:event__id
                }
            }
        )

        if(!updateUser)
        {
            return res.status(400).json({message:"CANNOT REMOVE THE REQUEST FORM THE USER "})
        }

        const updateEvent = await Event.findByIdAndUpdate(event__id,
            {
                $pull:{
                    sendRequest:_id,
                }
            }
        );

        if (!updateEvent)
        {
            return res.status(400).json({message:"CANNOT UPDATE THE EVENT "});
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
        

        return res.status(200).json({message:"request is successfully rejected "});

    } catch (error) {
        console.log("error ",error);
        return res.status(500).json({error:error});
        
    }
}
//get list for user who send the request to a event 
const getEventConnectionRequestListToEvents = async ( req,res)=>
{
    const _id = req.user._id;
    const event__id = req.body.eventId;
    try {
        const data =await  Event.findById(event__id).select("recivedRequest ").populate("recivedRequest")
        return res.status(200).json({message:"successfull get the data",data:data})
    } catch (error) {
        console.log("ERROR IN GET REQUEST EVENTS ")
        return res.status (500).json({error:error})
    }
}

//get the list of event request a user get 
const getEventConnectionRequestListToUser = async ( req,res)=>
{
    const _id = req.user._id;
   
    try {    
        const data =await  User.findById(_id).select("receivedEventConnectionRequest email").populate("receivedEventConnectionRequest")

        return res.status(200).json({message:"successfull get the data",data:data})
    } catch (error) {
        console.log("ERROR IN GET REQUEST EVENTS ")
        return res.status (500).json({error:error})
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
            return res.status(400).json({message: "YOU  ARE CREATOR OF THE EVENT " });
        }

        if(!user.connectedEvents.includes(event__id))
        {
            return res.status(400).json({message: "YOU ARE NOT CONNECTED TO THIS EVENT " });
        }
        console.log("the event id and _id is",event__id,_id);
        const leaveEvent = await Event.findByIdAndUpdate(event__id,
            {
                $pull: {
                    members: _id,
                }
            },
            { new: true }
        )
        console.log("after leave event ",leaveEvent);
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
        console.log("ERROR IN GET REQUEST EVENTS ",error)
        return res.status (500).json({error:error})
    }
}

const getSuggestionForEventConnectionRequest = async (req, res) => {
  const self_id = req.user._id;
  const event_id = req.params.eventId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(self_id) || !mongoose.Types.ObjectId.isValid(event_id)) {
      return res.status(400).json({ message: "Invalid ID(s)." });
    }

    // Check if event exists
    const eventExists = await Event.exists({ _id: event_id });
    if (!eventExists) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Get current user's filter data
    const currentUser = await User.findById(self_id).select(
      "connections blockUsers sendEventConnectionRequest"
    );
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }

    const blockedUserIds = currentUser.blockUsers;
    const sendRequestUserIds = currentUser.sendEventConnectionRequest;

    const skip = (page - 1) * limit;

    // Base query conditions
    const queryConditions = {
      _id: {
        $nin: [...blockedUserIds, ...sendRequestUserIds, self_id],
      },
      receivedEventConnectionRequest: { $ne: event_id },
      connectedEvents: { $ne: event_id }
    };

    // Get paginated results
    const nonFriends = await User.find(queryConditions)
      .select("username name")
      .skip(skip)
      .limit(limit);

    // Get total count (with same conditions as find)
    const totalNonFriends = await User.countDocuments(queryConditions);

    const totalPages = Math.ceil(totalNonFriends / limit);

    res.status(200).json({
      message: "List fetched successfully.",
      nonFriends,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalNonFriends,
        resultsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING NON-FRIENDS:", error);
    res.status(500).json({ 
      message: "Cannot fetch non-friends.", 
      error: error.message 
    });
  }
};


module.exports = { createEvent, getMyEvents, updateEventInfo, deleteEvent, sendEventConnectionRequest, sendEventConnectionRequestByOtherUser, unsendEventConnectionRequestByOtherUser, leaveEvent, unsendEventConnectionRequest, acceptEventConnectionRequestSendByOtherUser,rejectEventConnectionRequestSendByOtherUser,rejectEventConnectionRequestSendByCreator ,getEventConnectionRequestListToEvents,getEventConnectionRequestListToUser,acceptEventConnectionRequestSendByCreator,getEventRequests,getSuggestionForEventConnectionRequest};

