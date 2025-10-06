const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const User = require("../models/User");
const UserPost = require("../models/UserPost");

//create new post 
const createUserPost = async (req, res) => {
    try {
        const { content, isPublic } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!userId || !content) {
            return res.status(400).json({ message: "User ID and content are required" });
        }

        // Convert string to boolean
        const isPostPublic = isPublic === 'true' || isPublic === 'True';


        const imagePaths = (req.files || []).map(file => {
            const relativePath = path.join(
                'public',
                `user_${userId}`,
                'post',  // safe default
                file.originalname
            );

            return relativePath.replace(/\\/g, '/');
        });

        // Create a new post document
        const newPost = new UserPost({
            userId,
            content,
            createdBy: userId,
            image: imagePaths, // ✅ store array of image paths
            isPublic: isPostPublic,
        });

        // Add public link if public
        if (isPostPublic) {
            const publicLink = `${process.env.APP_URL}/public-posts/${newPost._id}`;
            newPost.publicLink = publicLink;
        }

        await newPost.save();

        user.posts.push(newPost._id);
        await user.save();



        return res.status(201).json({
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
        imageURLs
      };
    });

    res.status(200).json({ posts: postsWithImages });

  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getUserPosts };




//delete a post
const deleteUserPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;
        const post = await UserPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.isDeleted) {
            return res.status(400).json({ message: "Post already deleted" });
        }
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this post" });
        }
        // await UserPost.findByIdAndDelete(postId);
        await UserPost.updateOne(
            { _id: postId },
            { isDeleted: true }
        );
        return res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error });
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
        const _id = mongoose.Types.ObjectId(userId);
        const post = await UserPost.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const otherUserId = await User.findById(post.createdBy);

        if (!post.isPublic) {
            return res.status(403).json({ message: "Cannot like a private post" });
        }


        //liking and unliking logic
        if (post.likes.includes(userId)) {
            await UserPost.updateOne(
                { _id: _id },
                { $pull: { likes: _id } }
            );
            return res.status(200).json({ message: "Post unliked" });

        } else {
            await UserPost.updateOne(
                { _id: _id },
                { $push: { likes: _id } }
            )
            await User.updateOne(
                { _id: otherUserId },
                { $push: { notifications: { type: 'like', from: userId, post: postId, date: new Date(), message: `Somebody like your post ` } } }
            );
            return res.status(200).json({ message: "Post liked" });
        }

    }

    catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
}
//comment on a post
const commentOnPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;
        const userId = req.user._id;
        const _id = mongoose.Types.ObjectId(userId);
        const post = await UserPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (!post.isPublic) {
            return res.status(403).json({ message: "Cannot comment on a private post" });
        }
        if (!post.isCommentsAllowed) {
            return res.status(403).json({ message: "Comments are disabled for this post" });
        }

        //commenting logic
        await UserPost.updateOne(
            { _id: _id },
            { $push: { comments: { userId, comment, date: new Date() } } }
        );
        //send notification to post owner
        User.updateOne(
            { _id: post.createdBy },
            { $push: { notifications: { type: 'comment', from: userId, post: postId, date: new Date(), message: `Somebody commented on your post ` } } }
        );
        return res.status(200).json({ message: "Comment added successfully" });


    } catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }

}
//delete comment post
const deletePostComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const userId = req.user._id;
        const _id = mongoose.Types.ObjectId(userId);
        const post = await UserPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (!post.comments.includes(commentId)) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (post.comments.userId.toString() !== userId.toString() || post.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }
        await UserPost.updateOne(
            { _id: _id },
            { $pull: { comments: { _id: commentId } } }
        );
        return res.status(200).json({ message: "Comment deleted successfully" });
    }
    catch (error) {
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
module.exports = { createUserPost, getUserPosts, likeUnlikePost, commentOnPost, deletePostComment, deleteUserPost, getUserPostComments, getUserPostLikes, getPublicPosts };
