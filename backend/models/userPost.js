const mongoose = require('mongoose');
const { Schema } = mongoose;
const userPostSchema = new Schema({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    image: [{ type: String }],
    isPublic: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    comments: [{ type: Schema.Types.ObjectId, ref: 'PostComment' }],
    isCommentsAllowed: { type: Boolean, default: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    publicLink: { type: String }
});
const UserPost = mongoose.model('UserPost', userPostSchema);
module.exports = UserPost;