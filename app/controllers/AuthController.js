import db from "../config/db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const AuthController = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: async (req, res) => {
    //récupérer les data
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email et mot de passe requis" });
      return;
    }

    //ajouter le poivre au pwd
    const pepper = process.env.PEPPER;
    let passwordWithPepper = password + pepper;

    //récupérer les infos user
    const results = await getUserInfos(email).catch((err) => {
      res.status(500).json({ error: "Quelque chose s'est mal passé" });
      return;
    });
    //valeurs vides
    let username;
    let role;
    let pwd;
    //set les valeurs
    try {
      username = results[0]?.username;
      role = results[0].role;
      pwd = results[0].password;
    } catch (error) {
      res.status(500).json({ error: "Quelque chose s'est mal passé" });
      return;
    }
    //si rien n'est retourné (email incorrect ou pwd inexistant)
    if (results.length === 0 || !pwd || !username || !role) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }

    //sinon on vérifie le hash
    const accessGranted = await argon2.verify(pwd, passwordWithPepper);
    if (accessGranted) {
      //créer le refresh token
      const secret = process.env.JWTREFRESH_SECRET;
      const token = jwt.sign(
        {
          tokenType: "refresh",
          username: username,
          email: email,
          role: role,
        },
        secret,
        { expiresIn: "30d" },
      );
      //créer le access token
      const accessToken = createAccessToken({ username, email, role });

      //cookies
      res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
        path: "/api/auth/refresh",
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      //message de connexion réussie
      res.status(200).json({
        message: "Connexion réussie",
      });
      return;
    } else {
      //mdp faux -> message erreur plus générique
      res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: async (req, res) => {
    const { username, email, password, address, photoPath } = req.body;

    //test de force du mot de passe
    const level1 = /[a-zA-Z]{5,}/; //5 lettres (minuscule ou/et majuscule)
    const level2 = /[0-9]{2,}/; //2 chiffres
    if (!level1.test(password) || !level2.test(password)) {
      return res.status(400).json({
        error:
          "Votre mot de passe doit comporter au moins 5 lettres et 2 chiffres.",
      });
    }

    //ajouter le poivre au pwd
    const pepper = process.env.PEPPER;
    let passwordWithPepper = password + pepper;
    //hash le pwd
    const hashPassword = await argon2.hash(passwordWithPepper);

    //on s'en fiche que photoPath soit vide pour le moment
    if (!username || !email || !password || !address) {
      return res.status(400).json({
        error: "Un des champs requis est vide",
        username: username ? username : "champ vide",
        email: email ? email : "champ vide",
        password: password ? password : "champ vide",
        address: address ? address : "champ vide",
        photoPath: (photoPath ? photoPath : "champ vide") + " (facultatif)",
      });
    }

    //création d'un user
    //role est fixe -> user
    const query = `INSERT INTO users (username, email, password, role, address, photo_path) VALUES (?, ?, ?, 'user', ?, ?);`;
    db.query(
      query,
      [username, email, hashPassword, address, photoPath],
      (err, results) => {
        if (err) {
          res.status(500).json({ message: "Quelque chose s'est mal passé" });
        } else {
          res.status(201).json({ message: "Création réussie" });
        }
      },
    );
  },

  ///----------------------------------------------------------
  // POST /api/auth/refresh
  //----------------------------------------------------------
  refreshToken: async (req, res) => {
    const user = req.user;
    //get les infos user
    const { username, role } = getUserInfos(user.email).catch((err) => {
      res.status(500).json({ error: "Quelque chose s'est mal passé" });
      return;
    });

    //créer l'access token
    const token = createAccessToken({ username, email, role });

    //cookie
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    //message de connexion réussie
    res.status(200).json({
      message: "Token access renouvelé",
    });
  },
};

///Autres méthodes utiles
function createAccessToken(user) {
  const secret = process.env.JWTACCESS_SECRET;
  const token = jwt.sign(
    {
      tokenType: "access",
      username: user.username,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: "15m" },
  );
  return token;
}
async function getUserInfos(email) {
  const query = `SELECT password, username, role FROM users WHERE email = ? LIMIT 1;`;
  const results = await new Promise((resolve, reject) => {
    db.query(query, [email], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  return results;
}

export default AuthController;
