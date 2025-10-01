const express = require("express");
const router = express.Router();
const { createUserPost, getUserPosts, likeUnlikePost, commentOnPost, deletePostComment, deleteUserPost, getUserPostComments, getUserPostLikes } = require("../controllers/userPostController");

// Create a new user post
router.post("/create-post", createUserPost);    
// Get all posts for a user
router.get("/get-posts/:userId", getUserPosts);
// Like a user post
router.put("/like-post/:postId", likeUserPost);

module.exports = router;