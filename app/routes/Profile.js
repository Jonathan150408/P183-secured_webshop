//router
import express from "express";
const router = express.Router();
//path
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//autres
import multer from "multer";
import controller from "../controllers/ProfileController.js";

// Configuration de multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../public/uploads"),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.get("/", controller.get);
router.post("/", controller.update);
router.post("/photo", upload.single("photo"), controller.uploadPhoto);

export default router;
