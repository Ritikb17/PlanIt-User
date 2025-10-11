const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const User = require("../models/User");
const UserPost = require("../models/UserPost");
const Notification = require("../models/notification");
const Comment = require("../models/postComment");



//create new post 
const createUserPost = async (req, res) => {
    try {
        const { content, isPublic } = req.body;
        const userId = req.user._id;

        if (!userId || !content) {
            return res.status(400).json({ message: "User ID and content are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Convert string to boolean
        const isPostPublic = isPublic === "true" || isPublic === "True";

        // ✅ Use filenames exactly as Multer stored them
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file =>
                path
                    .join("public", `user_${userId}`, "post", file.filename)
                    .replace(/\\/g, "/")
            );
        } else if (req.file) {
            imagePaths = [
                path
                    .join("public", `user_${userId}`, "post", req.file.filename)
                    .replace(/\\/g, "/")
            ];
        }

        // ✅ Create a new post document
        const newPost = new UserPost({
            userId,
            content,
            createdBy: userId,
            image: imagePaths, // Correct file names from Multer
            isPublic: isPostPublic,
        });

        // Optional: Add public link for public posts
        if (isPostPublic) {
            newPost.publicLink = `${process.env.APP_URL}/public-posts/${newPost._id}`;
        }

        await newPost.save();

        user.posts.push(newPost._id);
        await user.save();

        res.status(201).json({
            message: "Post created successfully",
            post: newPost,
        });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

const getUserPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'posts',
                match: { isDeleted: false },
                options: { sort: { createdAt: -1 } }
            });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Build posts with accessible image URLs
        const postsWithImages = user.posts.map(post => {
            const imageURLs = (post.image || []).map(img => {
                // Remove duplicate public/ if present and normalize slashes
                const cleanPath = img.replace(/^public[\\/]/, '').replace(/\\/g, '/');
                return `${req.protocol}://${req.get('host')}/uploads/${cleanPath}`;
            });

            return {
                _id: post._id,
                content: post.content,
                createdAt: post.createdAt,
                isPublic: post.isPublic,
                likes: post.likes,
                comments: post.comments,
                imageURLs
            };
        });

        res.status(200).json({ posts: postsWithImages });

    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// //delete a post(HARD DELETE IMPLEMENTED)
// const deleteUserPost = async (req, res) => {
//     try {
//         const { postId } = req.params;
//         const userId = req.user._id;
//         const userIdObj = new mongoose.Types.ObjectId(userId);
//         const post = await UserPost.findById(postId);
//         if (!post) {
//             return res.status(404).json({ message: "Post not found" });
//         }

//         if (post.createdBy.toString() !== userId.toString()) {
//             return res.status(403).json({ message: "Unauthorized to delete this post" });
//         }
//         // Delete associated images from filesystem

//         for (const imgPath of post.image) {
//             const fullPath = path.join(__dirname, `../${imgPath}`);
//             fs.unlink(fullPath, (err) => {
//                 if (err) {
//                     console.error(`Error deleting file ${fullPath}:`, err); 
//                 } else {
//                     console.log(`Deleted file: ${fullPath}`);
//                 }});
//             }
//         // hard delete the post
//         await UserPost.deleteOne(
//             { _id: postId },
//             { isDeleted: true }
//         );
//         return res.status(200).json({ message: "Post deleted successfully" });
//     } catch (error) {
//         console.error("Error deleting post:", error);
//         return res.status(500).json({ message: "Server error", error });

//     }
// }
const deleteUserPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;
        const userIdObj = new mongoose.Types.ObjectId(userId);
        const post = await UserPost.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this post" });
        }
        if (post.isDeleted) {
            return res.status(400).json({ message: "Post already deleted" });
        }
        // Soft delete the post
        await UserPost.updateOne(
            { _id: postId },
            { isDeleted: true }
        )
        return res.status(200).json({ message: "Post deleted successfully" });


    } catch (error) {
        console.error("Error deleting post:", error);
        return json.status(500).json({ message: "Server error", error });
    }
}

//get comments of a post
const getUserPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await UserPost.findById(postId).populate('comments.userId', 'username profilePicture');
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        return res.status(200).json(post.comments);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }

}

//get likes of a post
const getUserPostLikes = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await User.findById(postId).populate('likes', 'username profilePicture');
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        return res.status(200).json(post.likes);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}
//like a post
const likeUnlikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;
        const _id = new mongoose.Types.ObjectId(userId);
        const post = await UserPost.findById(postId);
        const posttId = new mongoose.Types.ObjectId(postId);
        const user = await User.findById(userId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const creatorUserId = await User.findById(post.createdBy);

        if (!post.isPublic) {
            if (!creatorUserId.connections.includes(userId) || post.createdBy.toString() !== userId.toString()) {
                
                return res.status(403).json({ message: "cannot like this  post (not owner and its not public post )" });
            }
            return res.status(403).json({ message: "Cannot like a private post" });
        }
       


        //liking and unliking logic
        console.log("data", { type: 'like', from: userId, post: posttId, date: new Date(), message: `Somebody like your post ` })
        if (post.likes.includes(userId)) {
            await UserPost.updateOne(
                { _id: postId },
                { $pull: { likes: _id } }
            );
            return res.status(200).json({ message: "Post unliked" });

        } else {
            await UserPost.updateOne(
                { _id: postId },
                { $push: { likes: _id } }
            )
            //send notification to post owner
            await Notification.updateOne(
                { user: creatorUserId },
                { $push: { notifications: { type: 'like', message: `Somebody like your post ` } } }
            );
            return res.status(200).json({ message: "Post liked" });
        }

    }

    catch (error) {
        console.error("Error liking/unliking post:", error);
        return res.status(500).json({ message: "Server error", error });
    }
}
//comment on a post
const commentOnPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;
        const userId = req.user._id;
        const _id = new mongoose.Types.ObjectId(userId);
        const post = await UserPost.findById(postId);
        console.log("post comment ", comment);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (!post.isCommentsAllowed) {
            return res.status(403).json({ message: "Comments are disabled for this post" });
        }
        if (!post.isPublic) {
            return res.status(403).json({ message: "Cannot comment on a private post" });
        }

        //commenting logic
        const newComment = await Comment.create({
            postId,
            userId,
            comment
        });
        if (!newComment) {
            return res.status(500).json({ message: "Failed to add comment" });
        }
        await UserPost.updateOne({ _id: postId },
            { $push: { comments: newComment._id } })

        //send notification to post owner
        User.updateOne(
            { _id: post.createdBy },
            { $push: { notifications: { type: 'comment', from: userId, post: postId, date: new Date(), message: `Somebody commented on your post ` } } }
        );
        return res.status(200).json({ message: "Comment added successfully" });


    } catch (error) {
        console.error("Error adding comment:", error);
        return res.status(500).json({ message: "Server error", error });
    }

}

const LikeOnComment = async (req, res) => {
    try {
        const {commentId} = req.params;
    
        const comment = await Comment.findById(commentId);
        console.log("comment ",comment);
        if(!comment){
            return res.status(404).json({message:"Comment not found"});
        }
        const postId = comment.postId;
        const post = await UserPost.findById(postId);
        if(!post){
            return res.status(404).json({message:"Post not found"});
        }
        if(!post.isPublic){
            if(!post.createdBy.toString() !== req.user._id.toString()){
                return res.status(403).json({message:"cannot like comment on this post (not owner and its not public post )"});
            }
            return res.status(403).json({message:"Cannot like comment on a private post"});
        }
        if(comment.likes.includes(req.user._id)){
            comment.likes.pull(req.user._id);
            await comment.save();
            return res.status(400).json({message:"comment unliked"});
        }
        comment.likes.push(req.user._id);
        await comment.save();
        const Userr = await User.findById(comment.userId);
        await Notification.updateOne(
            { user: Userr },
            { $push: { notifications: { type: 'like', message: `Somebody like your comment on post ` } } }
        );
        return res.status(200).json({message:"Comment liked successfully"});

    } catch (error) {
        console.error("Error liking comment:", error);
        return res.status(500).json({ message: "Server error", error });
    }

}
//delete comment post
const deletePostComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const postId = comment.postId;

        const post = await UserPost.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (!user.posts.includes(postId)&&comment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }
        // Remove comment reference from post
        await User.updateOne(
            { _id: userId },
            { $pull: { comments: { _id: commentId } } }
        );


        const confirmDeleteComment = await Comment.deleteOne({ _id: commentId });
        if (!confirmDeleteComment) {
            return res.status(500).json({ message: "Failed to delete comment" });
        }
        return res.status(200).json({ message: "Comment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ message: "Server error", error });
    }

}
//get all public posts
const getPublicPosts = async (req, res) => {
    try {
        const postId = req.params.postId;
        const posts = await UserPost.findById(
            { _id: postId },
            { isPublic: true, isDeleted: false }
        ).sort({ createdAt: -1 });
        if (!posts) {
            return res.status(404).json({ message: "No posts found" });
        }
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
}
module.exports = { createUserPost, getUserPosts, likeUnlikePost, commentOnPost, deletePostComment, deleteUserPost, getUserPostComments, getUserPostLikes, getPublicPosts,LikeOnComment };
