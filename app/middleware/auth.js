// =============================================================
// Middleware d'authentification
// =============================================================
import jwt from "jsonwebtoken";
import db from "../config/db.js";

/**
 * vérifie le token d'accès
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
async function verifyAccessToken(req, res, next) {
  const token = req.cookies.accessToken;
  //vérifier le token
  try {
    //si token manquant
    if (!token) {
      throw new Error("MISSING_TOKEN");
    }
    const decoded = jwt.verify(token, process.env.JWTACCESS_SECRET);

    //vérifier le  type
    if (decoded.tokenType !== "access") {
      throw new Error("NOT_ACCESS_TOKEN");
    }

    //confirmer les infos avec la db
    const query =
      "SELECT id, username, role, email FROM users WHERE id = ? LIMIT 1";
    const result = await new Promise((resolve, reject) => {
      db.query(query, [decoded.id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }).catch((err) => {
      console.error("Erreur lors de la vérification du token d'accès : ", err);
      //500 en cas d'erreur
      throw new Error("SERVER_ERROR");
    });

    //404 si pas trouvé
    if (!result) {
      throw new Error("USER_NOT_FOUND");
    }

    //400 si infos correspondent pas
    if (
      result.id !== decoded.id ||
      "access" !== decoded.tokenType ||
      result.username !== decoded.username ||
      result.email !== decoded.email ||
      result.role !== decoded.role
    ) {
      throw new Error("TOKEN_MODIFIED");
    }

    //mettre les infos à portée de la suite
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };

    //tout est ok, on passe à la suite
    next();
  } catch (err) {
    console.error("Erreur de vérification du token d'accès : ", err);
    switch (err.message) {
      //customs
      case "MISSING_TOKEN":
        return res.status(400).json({ message: "Token manquant" });
      case "NOT_ACCESS_TOKEN":
        return res.status(401).json({ message: "Token de type incorrect" });
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "Utilisateur introuvable" });
      case "SERVER_ERROR":
        return res.status(500).json({ error: "Erreur serveur" });
      case "TOKEN_MODIFIED":
        return res.status(400).json({ error: "Token d'accès modifié" });
      //jwt
      case "TokenExpiredError":
        return res.status(401).json({ message: "Token expiré" });
      case "JsonWebTokenError":
        return res.status(401).json({ message: "Token invalide" });
      //default
      default:
        return res.status(401).json({ message: "Token d'accès invalide" });
    }
  }
}

/**
 * vérifie le token de rafraîchissement
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
function verifyRefreshToken(req, res, next) {
  //get le token refresh
  const token = req.cookies.refreshToken;
  //si token manquant
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }
  //vérifier le token
  try {
    const decoded = jwt.verify(token, process.env.JWTREFRESH_SECRET);
    req.user = decoded;
    if (req.user.tokenType !== "refresh") {
      return res
        .status(401)
        .json({ message: "Token de rafraîchissement invalide" });
    }
    next(); //tout est ok, on passe à la suite
  } catch (err) {
    //si token invalide
    return res.status(401).json({ message: "Token invalide" });
  }
}

/**
 * vérifie que l'utilisateur est un administrateur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
function verifyAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Accès refusé : rôle administrateur requis" });
  } else if (req.user.role === "admin") {
    //else if pour être certain que le rôle est bien admin avant de faire
    next();
  }
}

export { verifyAccessToken, verifyRefreshToken, verifyAdmin };
