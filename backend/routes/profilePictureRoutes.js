const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const profilePictureController = require('../controllers/profilePictureController');
// const authMiddleware = require('../middleware/authMiddleware'); // Your auth middleware

// Apply authentication middleware to all routes
// router.use(authMiddleware);

// Upload profile picture
router.post('/upload/:pictureType', 
  upload.single('profilePicture'),
  profilePictureController.uploadProfilePicture
);

// Change/Update profile picture
router.put('/change',
  upload.single('profilePicture'),
  profilePictureController.changeProfilePicture
);

// Delete profile picture
router.delete('/delete', 
  profilePictureController.deleteProfilePicture
);

// Get profile picture
router.get('/my-profile-picture', 
  profilePictureController.getProfilePicture
);

// Get any user's profile picture (public access)
// router.get('/public-profile-picture/:userId', 
//   profilePictureController.getPublicProfilePicture
// );

// Direct image serving route
// router.get('/image/:folderType/:userId/:filename', 
//   profilePictureController.serveImage
// );

// Get all images for a user in a specific folder
// router.get('/folder/:folderType', 
//   profilePictureController.getFolderImages
// );

module.exports = router;