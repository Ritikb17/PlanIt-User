const express = require("express");
const router = express.Router();
const {editBio,checkUserName,getNotification} = require('../controllers/userController')

router.get("/get-profile", (req, res) => {
    res.json(req.user );
});
router.get("/verify-token", (req, res) => {

  console.log("CALLED VERIFY",req.user);
  res.json({ valid: true, user: req.user });
});

router.put("/update-profile",editBio);
router.get("/check-user-name",checkUserName);


module.exports = router;
