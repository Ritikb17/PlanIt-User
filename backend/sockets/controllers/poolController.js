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
            // 1. Find the poll first to validate
            const poll = await ChannelPool.findById(poolData.pollId);
            if (!poll) {
                return callback({ success: false, message: "Poll not found" });
            }

            // 2. Check if user has already voted (if multiple choices not allowed)
            if (!poll.allowMultipleChoices) {
                const hasVoted = poll.options.some(option =>
                    option.voters.includes(userId)
                );
                if (hasVoted) {
                    return callback({ success: false, message: "You have already voted" });
                }
            }

            // 3. Create a clean update object without circular references
            const update = {
                $inc: { "options.$[option].votes": 1 },
                $addToSet: {
                    "options.$[option].voters": userId,
                    voters: userId
                }
            };

            // 4. Perform the update
            const updatedPoll = await ChannelPool.findByIdAndUpdate(
                poolData.pollId,
                update,
                {
                    arrayFilters: [{ "option._id": poolData.optionId }],
                    new: true
                }
            ).lean(); // Use lean() to get plain JavaScript object

            if (!updatedPoll) {
                throw new Error('Failed to update poll');
            }

            // 5. Create a clean object for broadcasting (no circular refs)
            const pollDataToBroadcast = {
                _id: updatedPoll._id,
                title: updatedPoll.title,
                options: updatedPoll.options.map(option => ({
                    _id: option._id,
                    title: option.title,
                    votes: option.votes,
                    voters: option.voters
                })),
                allowMultipleChoices: updatedPoll.allowMultipleChoices,
                status: updatedPoll.status
            };

            // 6. Broadcast update to channel
            socket.to(poll.channel.toString()).emit('poll-updated', pollDataToBroadcast);
            callback({ success: true, data: pollDataToBroadcast });

        } catch (error) {
            console.error("Error in voteToPoolToChannel:", error);
            callback({
                success: false,
                message: error.message || "Failed to process vote"
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