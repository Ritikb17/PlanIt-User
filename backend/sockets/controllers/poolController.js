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
            callback({ success: true, pool: pool, status: "success" });
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
            const poll = await ChannelPool.findById(poolData.pollId);
            if (!poll) return callback({ success: false, message: "Poll not found" });

            // Check if user already voted in any option (if multiple choices not allowed)
            if (!poll.allowMultipleChoices) {
                const hasVoted = poll.options.some(option =>
                    option.voters.some(voterId => voterId.equals(new mongoose.Types.ObjectId(poolData.userId)))
                );
                if (hasVoted) return callback({ success: false, message: "You have already voted" });
            }

            // Update option votes and voters array
            const update = {
                $inc: { "options.$[option].votes": 1 },
                $addToSet: { "voters": new mongoose.Types.ObjectId(poolData.userId) }
            };

            const updatedPoll = await ChannelPool.findByIdAndUpdate(
                poolData.pollId,
                update,
                {
                    arrayFilters: [{ "option._id": new mongoose.Types.ObjectId(poolData.optionId) }],
                    new: true
                }
            ).lean();

            if (!updatedPoll) throw new Error("Failed to update poll");

            callback({ success: true, data: updatedPoll });
        } catch (err) {
            callback({ success: false, message: err.message });
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
                message: "successfully get the pool"
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