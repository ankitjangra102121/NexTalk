const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const roleMiddleware = require("../middleware/role.middleware");

router.get("/", authMiddleware, roleMiddleware("admin"), (req, res) => {
  return res.json({
    success: true,
    message: "Welcome Admin",
  });
});

module.exports = router;
