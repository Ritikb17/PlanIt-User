const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const profilePictureController = require('../controllers/profilePictureController');


// Upload picture of any type (profilePicture, coverPhoto, etc.)
router.post('/upload/:pictureType', 
  upload.single('profilePicture'),
  profilePictureController.uploadPicture
);

// Change/Update profile picture
router.put('/change',
  upload.single('profilePicture'),
  profilePictureController.changeProfilePicture
);

// Delete profile picture
router.delete('/delete-picture/:pictureType', 
  profilePictureController.deletePicture
);

// Get profile picture
router.get('/my-profile-picture', 
  profilePictureController.getProfilePicture
);
// Get cover picture
router.get('/my-cover-picture', 
  profilePictureController.getCoverPicture
);
// Get cover picture of other user
router.get('/other-user-cover-picture/:username', 
  profilePictureController.getCoverPictureOfOtherUser
);
// Get any user's profile picture of other user
router.get('/other-user-profile-picture/:username', 
  profilePictureController.getProfilePictureOfOtherUser
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