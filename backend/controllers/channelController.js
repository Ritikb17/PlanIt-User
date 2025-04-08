const mongoose = require('mongoose');
const Channel = require('../models/channel');
const User = require('../models/User');
const Notification = require('../models/notification')
const ObjectId = mongoose.Types.ObjectId;
//for channel creator( create new channel)
const createChannel = async (req, res) => {
    const _id = req.user._id;
    const { name: nameOfChannel, bio, status: isPrivate } = req.body; // Destructure request body

    try {

        const user = await User.findById(_id);
        console.log("new channel is ",user);
    
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const nameCheck = user.channels.some(ch => ch.name === nameOfChannel);
        if (nameCheck) {
            return res.status(400).json({ message: "Channel with the same name already exists" });
        }

        const newChannel = await Channel.create({
            name: nameOfChannel,
            description: bio,
            isPrivate: req.body.isPrivate,
            createdBy: _id,
        });
        console.log("new channel is ",newChannel);
        if (newChannel) {
            console.log("new channel is being created ")
            const newC = { _id: newChannel._id, name: nameOfChannel };
            const addInUser = await User.findByIdAndUpdate(
                _id,
                { $push: { channels: newChannel._id } },
                { new: true }
            );
            if (!addInUser) {
                return res.status(400).json({ message: "Failed to update user with new channel" });
            }
        } else {
            return res.status(500).json({ error: "cannot create channel" });
        }




        return res.status(201).json({ message: "Channel created successfully", channel: newChannel });
    } catch (error) {
        console.error("Error creating channel:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
//for channel creator ( deleting the channel)
const deleteChannel = async (req, res) => {
    const _id = req.user._id; // User ID
    const channel__id = req.params.channelId; // Channel ID to delete
    const obj_channel_id = new mongoose.Types.ObjectId(channel__id);

    try {
        const channel = await Channel.findById(channel__id);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        if (!channel.createdBy.equals(_id)) {
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



        const ch = await Channel.findById(channel__id);
        console.log("Connected Users are:", ch.members);


        // removing channel from all the users 
        for (const member of ch.members) {

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
//for channel creator (send the connection request) 
const sendChannelConnectionRequest = async (req, res) => {
    const _id = req.user._id; // User ID (the one sending the request)
    const channel_id = req.body.channelId; // Channel ID to which the request is sent
    const sender_id = req.body.senderId; // Sender ID (the one initiating the request)
    const obj_sender_id = new mongoose.Types.ObjectId(sender_id);
    try {



        // Validate the user
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate the channel
        const channel = await Channel.findById(channel_id);

        // const check1 =  await channel.members.includes(sender_id);
        // if(check1)
        // {
        //     return res.status(400).json({message:"already member of this channel"});
        // }



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
        if (channel.sendRequest.includes(sender_id)) {
            return res.status(400).json({ message: "Request already sent" });
        }

        // Add the sender to the channel's sendRequest array
        const updatedChannel = await Channel.findByIdAndUpdate(
            channel_id,
            { $push: { sendRequest: sender_id } },
            { new: true }
        );

        if (!updatedChannel) {
            return res.status(400).json({ message: "Failed to send request to channel" });
        }

        // Add the channel to the sender's receivedChannelRequest array
        const updatedSender = await User.findByIdAndUpdate(
            sender_id,
            { $push: { receivedChannelRequest: channel_id } }, // Corrected spelling
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
                        message: "SEND YOU CONNECTION REQUEST",
                        type: "channel", // Changed to match your schema enum
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
// for the channel creator  (unsend the channel connection request) 
const unsendChannelConnectionRequest = async (req, res) => {
    const sender_id = req.body.senderId;
    const Obj_id = new mongoose.Types.ObjectId(sender_id);
    const channel_id = req.body.channelId;

    try {

        const channel = await Channel.findById(channel_id);
        const user = await User.findById(sender_id);
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }
        const check1 = await channel.sendRequest.includes(sender_id)
        if (!check1) {
            return res.status(404).json({ message: "request not found in the channel " });
        }


        if (!channel.createdBy.equals(_id)) {
            return res.status(403).json({ message: 'You do not have permission ' });
        }

        const updatedChannel = await Channel.findByIdAndUpdate(
            channel_id,
            { $pull: { sendRequest: Obj_id } }, /// removing senders id from the channel
            { new: true }
        );

        if (!updatedChannel) {
            return res.status(400).json({ message: "Failed to cancel request to channel" });
        }

        const check2 = await user.receivedChannelRequest.includes(channel_id)
        if (!check2) {
            return res.status(404).json({ message: "request not found in user side " });
        }

        const updatedSender = await User.findByIdAndUpdate(
            sender_id,
            { $pull: { receivedChannelRequest: channel_id } }, // removing the request from the other users collection 
            { new: true }
        );

        if (!updatedSender) {
            return res.status(400).json({ message: "Failed to update sender's request list" });
        }



        return res.status(200).json({ message: "Request rejected successfully" });
    } catch (error) {
        console.error("Error sending channel connection request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
//for user which decline the connection request 
const removeChannelConnectionRequest = async (req, res) => {
    const _id = req.user._id;
    const Obj_id = new mongoose.Types.ObjectId(_id);
    const channel_id = req.body.channelId;

    try {

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const channel = await Channel.findById(channel_id);
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }
        const updatedChannel = await Channel.findByIdAndUpdate(
            channel_id,
            { $pull: { sendRequest: Obj_id } },
            { new: true }
        );

        if (!updatedChannel) {
            return res.status(400).json({ message: "Failed to cancel request to channel" });
        }

        const updatedSender = await User.findByIdAndUpdate(
            _id,
            { $pull: { receivedChannelRequest: channel_id } },
            { new: true }
        );

        if (!updatedSender) {
            return res.status(400).json({ message: "Failed to update sender's request list" });
        }


        return res.status(200).json({ message: "Request rejected successfully" });
    } catch (error) {
        console.error("Error sending channel connection request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
//for user (accept the connection request)
const acceptChannelConnectionRequest = async (req, res) => {
    const _id = req.user._id; // User ID
    const channel_id = req.body.channelId; // Channel ID


    try {
        const channel = await Channel.findById(channel_id);

        const sender_id = await channel.createdBy;
        const obj_channel_id = new mongoose.Types.ObjectId(channel_id);
        const obj_id = new mongoose.Types.ObjectId(_id);
        const obj_sender_id = new mongoose.Types.ObjectId(sender_id);


        const user = await User.findById(_id);
       
        if (!user || !channel) {
            return res.status(404).json({ message: "User or channel not found" });
        }
        const hasRequest = user.receivedChannelRequest.includes(channel_id);
        if (!hasRequest) {
            return res.status(400).json({ message: "Request not found in user's received requests" });
        }

        // Remove request from user
        const removeRequestResult = await User.updateOne(
            { _id: _id },
            { $pull: { receivedChannelRequest: obj_channel_id } }
        );

        if (removeRequestResult.modifiedCount === 0) {
            return res.status(400).json({ message: "Failed to remove channel request" });
        }

        // Add user to channel's members
        const addMemberResult = await Channel.updateOne(
            { _id: channel_id },
            { $addToSet: { members: obj_id } } // Using $addToSet to prevent duplicates
        );

        // if (addMemberResult.modifiedCount === 0) {
        //     return res.status(400).json({ message: "Failed to add user to channel members" });
        // }

        // Add channel to user's connected channels
        const addChannelResult = await User.findByIdAndUpdate(
            { _id: _id },
            { $push: { connectedChannels: obj_channel_id } }
        );
        // const addChannelResultCreator= await User.findByIdAndUpdate(
        //     { _id: channel.createdBy },
        //     { $push: { connectedChannels: obj_channel_id } }
        // );

        const removeChannelIdFromSendRequest = await Channel.findByIdAndUpdate(channel_id, {
            $pull: { sendRequest: obj_id }
        },
            { new: true })

        if (addChannelResult.modifiedCount === 0) {
            return res.status(400).json({ message: "Failed to add channel to user's connections" });
        }

        const notificationVerification = await Notification.findOneAndUpdate(
            { user: sender_id },
            {
                $push: {
                    notification: {
                        message: `${req.user.username}ACCECPT YOUR CHANNEL CONNECTION REQUEST `,
                        type: "channel", // Changed to match your schema enum
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

        return res.status(200).json({ message: "Request accepted successfully" ,notificationVerification:notificationVerification});

    } catch (error) {
        console.error("Error accepting channel request:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

};
// for updating channel information
const updateChannelInfo = async (req, res) => {
    const channel__id = req.params.channelId;
    const _id = req.user._id;
    const data = req.body;
    try {
        const channelInfo = await Channel.findById(channel__id);

        if (!channelInfo.createdBy.equals(_id)) {
            return res.status(403).json({ message: 'You do not have permission to edit this channel' });
        }
        const update = await Channel.findByIdAndUpdate(channel__id, data);
        if (update) {
            res.status(200).json({ message: "data has been updated" });
        }
    } catch (error) {
        res.status(400).json({ error: error });

    }
}
const getMyChannels = async (req, res) => {
    const _id = req.user._id;
    try {
        const data = await User.findById(_id).populate('channels').select('channels');
        if (!data) {
            res.status(400).json({ error: "error in fetching data" })
        }
        res.status(200).json({ connectedgroups: data });

    } catch (error) {
        res.status(400).json({ error: error })
    }
}
const getOtherUserChannels = async (req, res) => {
    const _id = req.user._id;
    try {
        const data = await User.findById(_id).populate('connectedChannels').select('connectedChannels');
        if (!data) {
            res.status(400).json({ error: "error in fetching data" })
        }
        res.status(200).json({ connectedgroups: data });

    } catch (error) {
        res.status(400).json({ error: error })
    }
}
const leaveChannel = async (req, res) => {
    const channel__id = req.params.channelId;
    const _id = req.user._id;
    const obj_id = new mongoose.Types.ObjectId(_id);

    console.log("leave channel ")

    try {
        const removingIdFromUser = await User.findByIdAndUpdate(_id, { $pull: { connectedChannels: channel__id } },
            { new: true }
        )
      

        if (!removingIdFromUser) {
            res.status(400).json({ error: "cannnot remove id ffromm user " });
        }
        const removingUserFromChannel = await Channel.findByIdAndUpdate(channel__id, { $pull: { members: _id } },
            { new: true })
        if (!removingUserFromChannel) {
            res.status(400).json({ error: "cannnot remove id ffromm channel " });
        }

        res.status(200).json({ message: "successfully leaves the group" })
    } catch (error) {
        res.status(400).json({ error: error });
    }
}

const getRequestChannels= async (req,res)=>
{
    const _id = req.user._id;
    try {
        const data =await  User.findById(_id).select("receivedChannelRequest email").populate("receivedChannelRequest")
        if(!data){
            return res.status(400).json({message:"error in in Query"});
        }
        console.log("data from the DB ",data);
        res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({error:error});   
    }
}
const getDiscoverChannels = async (req, res) => {
    const _id = req.user._id;
    try {
       
        const userChannels = await Channel.find({ members: _id }).select('_id');
        const userChannelIds = userChannels.map(ch => ch._id);

    
        const data = await Channel.find({ 
            createdBy: { $ne: _id },
            _id: { $nin: userChannelIds }
        }).select('');
        
        if (!data) {
            return res.status(404).json({ message: "No channels found" });
        }
        
        res.status(200).json({ data: data });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
module.exports = { getRequestChannels,createChannel, deleteChannel, sendChannelConnectionRequest, removeChannelConnectionRequest, unsendChannelConnectionRequest, acceptChannelConnectionRequest, getMyChannels, updateChannelInfo, leaveChannel ,getDiscoverChannels,getOtherUserChannels}