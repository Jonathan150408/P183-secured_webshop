// =============================================================
// Middleware d'authentification
// =============================================================
const jwt = require("jsonwebtoken");

function verifyAccessToken(req, res, next) {
  const token = req.headers["authorization"].split(" ")[1]; // Récupère le token après "Bearer "
  //si token manquant
  if (!token) {
    return res.status(403).json({ message: "Token manquant" });
  }
  //vérifier le token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (req.user.tokenType !== "access") {
      return res.status(401).json({ message: "Token d'accès invalide" });
    }
    next(); //tout est ok, on passe à la suite
  } catch (err) {
    //si token invalide
    return res.status(401).json({ message: "Token invalide" });
  }
}

function verifyRefreshToken(req, res, next) {
  const token = req.headers["authorization"].split(" ")[1]; // Récupère le token après "Bearer "
  //si token manquant
  if (!token) {
    return res.status(403).json({ message: "Token manquant" });
  }
  //vérifier le token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

module.exports = { verifyRefreshToken, verifyAccessToken, verifyAdmin };
