const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User'); // Make sure this path is correct
const getFileUrl = (req, filename, folderType, userId) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${folderType}/user_${userId}/${filename}`;
};
const profilePictureController = {

  // Upload picture of any type (profilePicture, coverPhoto, etc.)
  async uploadPicture(req, res) {
    try {
      console.log('Upload profile picture called');

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const userId = req.user.id;
      const pictureType = req.params.pictureType; // Access the dynamic parameter
      console.log('User ID:', userId);

      // Find user
      const user = await User.findById(userId);
      console.log("req.file.path", req.file.path);

      //removing the previous profile picture if exists
      if(req.params.pictureType==='profilePicture'&& user.profilePicture!== 'default.jpg')
      {imagePath = path.join(
        __dirname,
        `../${user.profilePicture}`
      );
      await fs.unlink(imagePath);
      }    
      if(req.params.pictureType==='coverPicture'){
      user.coverPicture = `/public/user_${userId}/${req.params.pictureType}/${req.file.filename}`;
      await user.save();
      }
      if(req.params.pictureType==='profilePicture'){
      user.profilePicture = `/public/user_${userId}/${req.params.pictureType}/${req.file.filename}`;
      await user.save();
      }
      if (!user) {
        // Delete uploaded file if user not found
        await fs.unlink(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

     return res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
      });

    } catch (error) {
      console.error('Upload profile picture error:', error);

      // Delete uploaded file in case of error
      console.log("req.file.path", req.file.path);
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Error uploading profile picture',
        error: error.message
      });
    }
  },

  // Get profile picture
async getProfilePicture(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const imagePath = path.join(
      __dirname,
      `../${user.profilePicture}`
    );

    // Send the image file
    res.sendFile(path.normalize(imagePath));

  } catch (error) {
    console.error('Get profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile picture',
      error: error.message
    });
  }
},

//get cover picture
async getCoverPicture(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('coverPicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const imagePath = path.join(
      __dirname,
      `../${user.coverPicture}`
    );

    // Send the image file
    res.sendFile(path.normalize(imagePath));

  } catch (error) {
    console.error('Get cover picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cover picture',
      error: error.message
    });
  }
},

  // Change/Update profile picture
  async changeProfilePicture(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        await fs.unlink(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete old profile picture if exists
      if (user.profilePicture && user.profilePicture !== 'default.jpg') {
        const oldPicturePath = path.join(__dirname, '../public/uploads/profiles', user.profilePicture);
        try {
          await fs.access(oldPicturePath);
          await fs.unlink(oldPicturePath);
        } catch (error) {
          console.log('Old profile picture not found or already deleted');
        }
      }

      // Update user with new profile picture
      user.profilePicture = req.file.filename;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
        data: {
          profilePicture: `/uploads/profiles/${req.file.filename}`,
          filename: req.file.filename
        }
      });

    } catch (error) {
      console.error('Change profile picture error:', error);

      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error changing profile picture',
        error: error.message
      });
    }
  },

  // Delete profile picture
  async deleteProfilePicture(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user has a profile picture to delete
      if (!user.profilePicture || user.profilePicture === 'default.jpg') {
        return res.status(400).json({
          success: false,
          message: 'No profile picture to delete'
        });
      }

      const picturePath = path.join(__dirname, '../public/uploads/profiles', user.profilePicture);

      // Delete file from filesystem
      try {
        await fs.access(picturePath);
        await fs.unlink(picturePath);
      } catch (error) {
        console.log('Profile picture file not found, continuing with database update');
      }

      // Reset to default profile picture
      user.profilePicture = 'default.jpg';
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile picture deleted successfully',
        data: {
          profilePicture: '/uploads/profiles/default.jpg'
        }
      });

    } catch (error) {
      console.error('Delete profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting profile picture',
        error: error.message
      });
    }
  },



};

module.exports = profilePictureController;