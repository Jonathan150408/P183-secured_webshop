const express = require("express");
const router = express.Router();
const controller = require("../controllers/AdminController");
const { verifyAccessToken, verifyAdmin } = require("../middleware/auth");

router.get("/users", verifyAccessToken, verifyAdmin, controller.getUsers);

module.exports = router;
