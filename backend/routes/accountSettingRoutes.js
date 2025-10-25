const express = require('express');
const router = express.Router();
const { updateAccountPrivacy} = require('../controllers/accountSettingController');

router.put('/update-account-privacy', updateAccountPrivacy);

module.exports = router;