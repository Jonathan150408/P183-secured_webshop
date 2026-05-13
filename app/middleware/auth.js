// =============================================================
// Middleware d'authentification
// =============================================================
import jwt from "jsonwebtoken";

/**
 * vérifie le token d'accès
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
function verifyAccessToken(req, res, next) {
  //get le token access
  const token = req.cookies.accessToken;
  //si token manquant
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }
  //vérifier le token
  try {
    const decoded = jwt.verify(token, process.env.JWTACCESS_SECRET);
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
