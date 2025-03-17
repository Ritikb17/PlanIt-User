const mongoose = require('mongoose');
const {Schema }= mongoose;

const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    notification :[{
        message:{type:String,},
        isSeen:{type:Boolean, default:false}
    }],
   
},{ timestamps: true })

module.exports = mongoose.model("Notfication", notificationSchema);

