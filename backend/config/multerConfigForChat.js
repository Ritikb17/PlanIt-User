const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const userId = req.user?._id || req.user?.id;
      const pictureType = req.params.pictureType;

      if (!userId) return cb(new Error('User not authenticated'), null);
      if (!pictureType) return cb(new Error('Missing picture type'), null);

      // Create user-specific folder path
      const userFolder = path.resolve(__dirname, '../public', `chatFiles`, {chatId: req.body.chatId});

      // Create folder if it doesn't exist
      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
        console.log(`Created folder for user: user_${userId}`);
      }

      console.log("Saving files to:", userFolder);
      cb(null, userFolder);
    } catch (error) {
      console.error('Error creating user folder:', error);
      cb(error, null);
    }
  },

  filename: (req, file, cb) => {
    console.log("Received file:", file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = `image_${uniqueSuffix}${fileExtension}`;
    cb(null, filename);
  }
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({
  storage,
  // fileFilter,
  // limits: {
  //   fileSize: 5 * 1024 * 1024, // 5MB limit per file
  //   files: 5 // max 5 files per upload
  // }
});

module.exports = upload;
