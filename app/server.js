import "dotenv/config.js";

import {
  verifyRefreshToken,
  verifyAccessToken,
  verifyAdmin,
} from "./middleware/auth.js";
import express from "express";
import https from "https";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const options = {
  key: fs.readFileSync(path.join(__dirname, "certs", "key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "certs", "cert.pem")),
};

// Middleware pour parser le corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (CSS, images, uploads...)
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------
// Routes API (retournent du JSON)
// ---------------------------------------------------------------
import authRoute from "./routes/Auth.js";
import profileRoute from "./routes/Profile.js";
import adminRoute from "./routes/Admin.js";

app.use("/api/auth", authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/admin", verifyAccessToken, verifyAdmin, adminRoute);

// ---------------------------------------------------------------
// Routes pages (retournent du HTML)
// ---------------------------------------------------------------
import homeRoute from "./routes/Home.js";
import userRoute from "./routes/User.js";

app.use("/", homeRoute);
app.use("/user", userRoute);

app.get("/login", (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "login.html")),
);
app.get("/register", (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "register.html")),
);
app.get("/profile", verifyAccessToken, (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "profile.html")),
);
app.get(
  "/admin",
  verifyAccessToken,
  verifyAdmin,
  (
    _req,
    res, //need admin verif
  ) => res.sendFile(path.join(__dirname, "views", "admin.html")),
);

// Démarrage du serveur
const server = https.createServer(options, app);
server.listen(8080, () => {
  console.log("Serveur démarré sur https://localhost:8080");
});

// //code IA
// //close le serveur pour éviter crash "Address already in use" à chaque redémarrage
// const shutdown = () => {
//   console.log("Cleaning up...");
//   server.close(() => {
//     console.log("Server closed");
//     process.exit(0);
//   });
// };
// process.on("SIGINT", shutdown);
// process.on("SIGTERM", shutdown);
// process.on("SIGUSR2", shutdown);
// process.on("exit", shutdown);
