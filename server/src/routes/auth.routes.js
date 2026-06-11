const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

const {
  registerValidation,
  loginValidation,
} = require("../validators/auth.validator");

router.post("/refresh-token", authController.refreshAccessToken);


router.post("/register", registerValidation, authController.register);

router.post("/login", loginValidation, authController.login);

router.post("/logout", authController.logout);

router.get("/profile", authMiddleware, authController.profile);

module.exports = router;
