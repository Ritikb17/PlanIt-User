const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const profilePictureController = require('../controllers/profilePictureController');
// const authMiddleware = require('../middleware/authMiddleware'); // Your auth middleware

// Apply authentication middleware to all routes
// router.use(authMiddleware);

// Upload profile picture
router.post('/upload', 
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

// Get profile picture info
router.get('/', 
  profilePictureController.getProfilePicture
);

module.exports = router;