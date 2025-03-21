const express = require('express');
const router = express.Router();
const {searchUser} = require('../controllers/otherController')
router.get('/search-user/:search', searchUser);
module.exports = router;