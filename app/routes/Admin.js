import express from "express";
const router = express.Router();
import { verifyAccessToken, verifyAdmin } from "../middleware/auth.js";
import controller from "../controllers/AdminController.js";

router.get("/users", verifyAccessToken, verifyAdmin, controller.getUsers);

export default router;
