const mondoose = require("mongoose");
const { likeUnlikePost } = require("../controllers/userPostController");
const { Schema } = mondoose;

const postCommentSchema = new Schema({ 
    postId: { type: Schema.Types.ObjectId, ref: 'UserPost', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [{ type: Schema.Types.ObjectId, ref: 'PostComment' }],
    isDeleted: { type: Boolean, default: false }
 });
const PostComment = mondoose.model("PostComment", postCommentSchema);
module.exports = PostComment;