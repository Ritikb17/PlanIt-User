const express = require("express");
const router = express.Router();
const multer = require('multer');
const { createUserPost, getUserPosts, likeUnlikePost, commentOnPost, deletePostComment, deleteUserPost, getUserPostComments, getUserPostLikes,LikeOnComment ,replayOnComment,getUserPostImage,getSinglePost} = require("../controllers/userPostController");
const upload = require('../config/multerConfig');
// Create a new user post
// router.post("/create-post", createUserPost);  


// create post with multiple images with the field name 'images'
router.post(
  "/create-post/:pictureType",
  upload.array('images'), 
  createUserPost
);
// router.get('/user', getUserPosts);

// Get all posts for a userser_690da07356de98cb53c7afc0ser_690da07356de98cb53c7afc0

//get all the post of login user
router.get("/get-user-posts", getUserPosts);

// Get images of a user post
router.get("/:userID/post/:imageName",getUserPostImage);

//delete a user post
router.delete("/delete-post/:postId", deleteUserPost);

// Like or Unlike a user post
router.put("/like-unlike-post/:postId", likeUnlikePost);

// Comment on a user post
router.post("/comment-on-post/:postId", commentOnPost);

// Like or Unlike on a comment
router.put("/like-unlike-on-comment/:commentId", LikeOnComment);

// Replay on a comment
router.post("/replay-on-comment/:commentId",replayOnComment);

// Delete a comment
router.delete("/delete-comment/:commentId", deletePostComment);

//get single post 
router.get("/get-post/:postId", getSinglePost);

// router.get("/get-post-comments/:postId", getUserPostComments);
// router.get("/get-post-likes/:postId", getUserPostLikes);
// Like a user post
// router.put("/like-post/:postId", likeUserPost);


module.exports = router;