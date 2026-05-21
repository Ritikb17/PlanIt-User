const mongoose = require('mongoose');
const User = require("../models/User");
const Event = require("../models/event");
const Channel = require("../models/channel");
const searchUser = async (req, res) => {
    const searchTerm = req.params.search; 
  
    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required." });
    }
  
    try {
     
      const result = await User.find({
        username: { $regex: searchTerm, $options: "i" }, 
      }).select('username name');
  
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "No users found." });
      }
  
      res.status(200).json({ message: "Search results", result });
    } catch (error) {
      console.error("Error in searching:", error);
      res.status(500).json({ message: "Error in searching", error: error.message });
    }
  };
const getEventDetails = async (req, res) => {
    const eventId = req.params.eventId;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({ message: "Invalid event ID." });
    }

    try {
        const event = await Event.findById(eventId).populate('createdBy', 'username name');
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }
        // If the event is private or not
         if(event.isPrivate){
            
            //check if the user is a member of the event or the creator of the event
            if(event.members.includes(userId) || event.createdBy._id.toString() === userId){
            return res.status(200).json({ message: "Event details", event });
        } else {
            return res.status(404).json({ message: "Event not found." });
        }
        }else{
            return res.status(200).json({ message: "Event details", event });
        }
        
    } catch (error) {
        console.error("Error in fetching event details:", error);
        res.status(500).json({ message: "Error in fetching event details", error: error.message });
    }
};
const getChannelInfo = async (req, res) => {
    const channelId = req.params.channelId;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID." });
    }

    try {
        const channel = await Channel.findById(channelId).populate('createdBy', 'username name');
        if (!channel) {
            return res.status(404).json({ message: "Channel not found." });
        }
        if(channel.isPrivate){
        //check if the user is a member of the channel or the creator of the channel
        // return res.status(200).json(channel.members)

        
        if (channel.members.some(member => member.user.toString() === userId.toString() && !member.isblocked)) {   
            return res.status(200).json({ message: "Channel details", channel });
        } else {
            return res.status(404).json({ message: "Channel not found." });
        }
      }
      else{
        return res.status(200).json({ message: "Channel details", channel });
      }
        
    } catch (error) {
        console.error("Error in fetching channel details:", error);
        res.status(500).json({ message: "Error in fetching channel details", error: error.message });
    }
  }
module.exports ={searchUser,getEventDetails,getChannelInfo};