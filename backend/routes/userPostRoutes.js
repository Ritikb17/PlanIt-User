const express = require("express");
const router = express.Router();
const multer = require('multer');
const { createUserPost, getUserPosts, likeUnlikePost, commentOnPost, deletePostComment, deleteUserPost, getUserPostComments, getUserPostLikes } = require("../controllers/userPostController");
const upload = require('../config/multerConfig');
// Create a new user post
// router.post("/create-post", createUserPost);  


// create post with multiple images with the field name 'images'
router.post(
  "/create-post/:pictureType",
  upload.array('images'), 
  createUserPost
);
router.get('/user', getUserPosts);

// Get all posts for a user
router.get("/get-user-posts", getUserPosts);
// Like a user post
// router.put("/like-post/:postId", likeUserPost);


module.exports = router;