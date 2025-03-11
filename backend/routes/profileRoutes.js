const express = require("express");
const router = express.Router();

router.get("/get-profile", (req, res) => {
    res.json({ user: req.user });
});
router.get("/verify-token", (req, res) => {

  console.log("CALLED VERIFY",req.user);
  res.json({ valid: true, user: req.user });
});

module.exports = router;
