import express from "express";
import controller from "../controllers/AuthController.js";
import { verifyRefreshToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", controller.login);
router.post("/register", controller.register);
router.post("/refresh", verifyRefreshToken, controller.refreshToken);
router.post("/logout", controller.logout);
router.get("/check", controller.checkAuth);

export default router;
