const mongoose = require('mongoose');
const Channel = require('../models/channel');
const User = require('../models/User');
const ObjectId = mongoose.Types.ObjectId;
//for channel creator( create new channel)
const createChannel = async (req, res) => {
    const _id = req.user._id;
    const { name: nameOfChannel, bio, status: isPrivate } = req.body; // Destructure request body

    try {

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const nameCheck = user.channels.some(ch => ch.name === nameOfChannel);
        if (nameCheck) {
            return res.status(400).json({ message: "Channel with the same name already exists" });
        }

        const newChannel = await Channel.create({
            name: nameOfChannel,
            bio: bio,
            isPrivate: isPrivate,
            createdBy: _id
        });
        if (newChannel) {
            const newC = { _id: newChannel._id, name: nameOfChannel };
            const addInUser = await User.findByIdAndUpdate(
                _id,
                { $push: { channels: newC } },
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

        const updatedUser = await User.findByIdAndUpdate(
            _id,
            { $pull: { channel: { _id: channel__id } } },
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

    try {
        // Validate the user
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate the channel
        const channel = await Channel.findById(channel_id);
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
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
       
        const obj_channel_id = new mongoose.Types.ObjectId(channel_id);
        const obj_id = new mongoose.Types.ObjectId(_id);

   
        const user = await User.findById(_id);
        const channel = await Channel.findById(channel_id); 

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

        if (addMemberResult.modifiedCount === 0) {
            return res.status(400).json({ message: "Failed to add user to channel members" });
        }

        // Add channel to user's connected channels
        const addChannelResult = await User.updateOne(
            { _id: _id },
            { $addToSet: { connectedChannels: obj_channel_id } }
        );

        if (addChannelResult.modifiedCount === 0) {
            return res.status(400).json({ message: "Failed to add channel to user's connections" });
        }

        return res.status(200).json({ message: "Request accepted successfully" });

    } catch (error) {
        console.error("Error accepting channel request:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
const deleteChannel = async (req, res) => {
    const _id = req.user._id;
    const channelId = req.body.channelId;
    try {
        const check1 = await Channel.find({ createdBy: _id });
        if (!check1) {
            return res.status(404).json({ message: "You can't delete the channel" });
        }

        await Channel.updateOne({ _id: channelId }, { isDelete: true });
        res.status(200).json({ message: "Channel deleted successfully" });
    } catch (error) {
        return res.status(400).json({ error: error });
    }
};
};
module.exports = { createChannel, deleteChannel, sendChannelConnectionRequest, removeChannelConnectionRequest, unsendChannelConnectionRequest, acceptChannelConnectionRequest }