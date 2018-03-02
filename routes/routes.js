const express = require("express");
const router = express.Router();
const pageController = require("../controllers/pageController");
const authController = require("../controllers/authController");
const { catchErrors } = require("../helpers/errorHandlers");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: "20MB",
    files: 1
  }
});

// NOTE: Use catchErrors() to wrap any async controller methods, e.g. Mongo queries

router.get("/", pageController.homepage);
router.get("/logout", authController.logout);
router.get("/login", pageController.login);
router.post("/login", authController.login);
router.get("/create-user", pageController.createUser);
router.post("/create-user",
  authController.validateRegister,
  authController.createUser,
  authController.login
);

module.exports = router;