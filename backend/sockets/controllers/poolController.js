const mongoose = require('mongoose');
const ChannelPool = require("../../models/channelPool");
const Channel = require('../../models/channel');
module.exports = {
    createPoolToChannel: async (socket, userId, poolData, callback) => {
        try {
            console.log("the data in the controller", poolData.channelId)
            const channel = await Channel.findById(poolData.channelId);
            console.log("channel is ", channel)
            if (!channel.members.includes(socket.user?._id)) {
                throw new Error("Unauthorized: Missing user ID");
            }


            const saveData = {
                title: poolData.title,
                ChannelId: poolData.channelId,
                options: poolData.options,
                allowMultipleChoices: poolData.allowMultipleChoices,
                createdBy: poolData.createdBy

            }
            const pool = await ChannelPool.create(saveData);
            console.log(" saved pool is", pool);

            const newMessage = {
                message: poolData.title,
                sender: userId,
                timestamp: new Date(),
                isEdited: false,
                isDeleted: false,
                isPool: true,
                pool: pool._id
            };


            const updatedChannel = await Channel.findByIdAndUpdate(
                poolData.channelId,
                {
                    $push: {
                        messages: newMessage
                    }
                },
                { new: true }
            );

            console.log("the updated channel is", updatedChannel)
            callback({ success: true, pool: pool });
        }
        catch (error) {
            console.error("Failed to fetch notifications:", error);

            callback({
                success: false,
                error: error.message,
            });
        }
    },
    closePoolToChannel: async (socket, userId, poolData, callback) => {
        try {
            console.log("pool data is", poolData);
            const pool = await ChannelPool.findById(poolData.poolId);
            if (!pool.createdBy.equals(userId)) {
                callback({ success: false, message: "You are not the creator of this pool" })
                return;
            }
            const updatedChannel = await Channel.findByIdAndUpdate(poolData.channelId, {
                status: 'close'
            })
            if (updatedChannel) {
                callback({ success: true })
            }

        } catch (error) {
            console.log(error)
            callback({
                success: false,
                error: error.message,
            });
        }

    },
    voteToPoolToChannel: async (socket, userId, poolData, callback) => {
        try {
            console.log("pool data is", poolData);
            const updatedPoll = await ChannelPool.findByIdAndUpdate(
                poolData.poolId,
                {
                    $inc: { "options.$[option].votes": 1 },
                    $push: { "options.$[option].voters": userId }
                },
                {
                    arrayFilters: [{ "option._id": poolData.optionId }],  // Target specific option
                    new: true  // Return the updated document
                }
            )

            if (!updatedPoll) {
                throw new Error('Poll not found');
            }

            // Broadcast update to channel
            socket.to(updatedPoll.channel).emit('poll-updated', updatedPoll);
            callback({ success: true })




        } catch (error) {
            callback({
                success: false,
                error: error.message,
            });

        }
    },
    getPoolOfChannel: async (socket, userId, poolData, callback) => {
        try {
            const channel = await ChannelPool.findById(poolData.channelId);
            if (!channel.members.includes(userId)) {
                callback({ success: false, error: "You are not a member of this channel" });
            }
            const pool = await ChannelPool.findById(poolData.poolId)
            callback({
                success: true,
                pool: pool,
                message:"successfully get the pool"
            });
        } catch (error) {
            console.log(error)
            callback({
                success: false,
                error: error.message,
            })

        }
    }
}