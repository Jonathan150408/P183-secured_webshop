import express from "express";
import controller from "../controllers/AuthController.js";
import { verifyRefreshToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", controller.login);
router.post("/register", controller.register);
router.post("/refresh", verifyRefreshToken, controller.refreshToken);

export default router;
