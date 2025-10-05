const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create storage with dynamic user folders
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {

      console.log("Request Params:", req.params);
      // Get user ID from authenticated request (make sure auth middleware runs first)
      const userId = req.user.id;
      const pictureType = req.params.pictureType; // Access the dynamic parameter
      console.log("Picture Type:", pictureType);
      if (!userId) {
        return cb(new Error('User not authenticated'), null);
      }

      // Create user-specific folder path: uploads/profiles/user_{userId}
      const userFolder = path.join(__dirname, '../public/',`user_${userId}/${pictureType}`);
      
      // Create folder if it doesn't exist
      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
        console.log(`Created folder for user: user_${userId}`);
      }
      
      cb(null, userFolder);
    } catch (error) {
      console.error('Error creating user folder:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = `profile_${uniqueSuffix}${fileExtension}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  // fileFilter: fileFilter,
  // limits: {
  //   fileSize: 5 * 1024 * 1024, // 5MB
  //   files: 3 // Max 3 files
  // }
});

module.exports = upload;