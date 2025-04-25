const mongoose = reqire('mongoose');
const Channel =  require('../models/channel')

module.exports={

    handleGetMessages : async(socket ,io,{channelId,userId},callback)=>
    {
        try {
        const channel = await  Channel.findOne(channelId);
        if(!channel)
        {
            throw new Error ("Channel not found ");
        }

        const include = channel.members.includes(userId);
        if(!include)
            {
                throw new Error ("User  not found  in channel ");
            }

            callback({
                status: 'success',
                messages: channel.message || [],
              });

            }
            catch (error) {
                console.error("Error in getMessages:", error);
                callback({
                  status: 'error',
                  message: error.message
                });
              }

    },
    

}