// =============================================================
// Middleware d'authentification
// =============================================================
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const token = req.headers["authorization"].split(" ")[1]; // Récupère le token après "Bearer "

  //si token manquant
  if (!token) {
    return res.status(403).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); //tout est ok, on passe à la suite
  } catch (err) {
    //si token invalide
    return res.status(401).json({ message: "Token invalide" });
  }
}

module.exports = { verifyToken };
