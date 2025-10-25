const User = require('../models/User');
const mongoose = require('mongoose');


const updateAccountPrivacy = async (req, res) => {
  const userId = req.user.id;
  const updates = req.body.accountType;

  try {
   const user = await User.findByIdAndUpdate(
  userId, 
  { accountPrivacy: updates },  
  { new: true, runValidators: true }  
);

    if (!user) {
      return res.status(404).json({ message: 'error updating account privacy' });
    }
    res.status(200).json({ message: 'Account privacy updated successfully', user });
  } catch (error) {
    console.error('Error updating account settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  updateAccountPrivacy
};
