const mongoose = require('mongoose');
const { Schema } = mongoose;


const postCommentSchema = new Schema({ 
    postId: { type: Schema.Types.ObjectId, ref: 'UserPost', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [{ type: Schema.Types.ObjectId, ref: 'PostComment' }],
    isDeleted: { type: Boolean, default: false }
 });

module.exports = mongoose.models.PostComment || mongoose.model("PostComment", postCommentSchema);