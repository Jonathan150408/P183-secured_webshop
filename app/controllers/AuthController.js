import db from "../config/db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

const AuthController = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    //ajouter le poivre au pwd
    const pepper = process.env.PEPPER;
    let passwordWithPepper = password + pepper;

    const query = `SELECT password FROM users WHERE email = ? LIMIT 1;`;

    db.query(query, [email], async (err, results) => {
      //si erreur
      if (err) {
        return res.status(500).json({ error: err.message, query: query });
      }
      //si rien n'est retourné (email incorrect ou pwd inexistant)
      if (results.length === 0) {
        return res
          .status(400)
          .json({ error: "Email ou mot de passe incorrect" });
      }

      //sinon on vérifie le hash
      const accessGranted = await argon2.verify(
        results[0].password,
        passwordWithPepper,
      );
      if (accessGranted) {
        //mot infos utilisateur ok -> connexion et création du token
        //récupérer les data utilisateur
        const userInfosQuery = `SELECT username, role FROM users WHERE email = ? LIMIT 1;`;
        //aidé par l'IA pour la promess
        const results = await new Promise((resolve, reject) => {
          db.query(userInfosQuery, [email], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        const username = results[0]?.username;
        const role = results[0].role;

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

        //message de connexion réussie
        res.status(200).json({
          message: "Connexion réussie",
          refreshToken: token,
        });
      } else {
        //mdp faux -> message erreur plus générique
        res.status(400).json({ message: "Email ou mot de passe incorrect" });
      }
    });
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
  refreshToken: (req, res) => {
    console.log(req);
    const { username, email, role } = req.user;
    //créer l'access token
    const secret = process.env.JWTACCESS_SECRET;
    const token = jwt.sign(
      {
        tokenType: "access",
        username: username,
        email: email,
        role: role,
      },
      secret,
      { expiresIn: "15m" },
    );

    //message de connexion réussie
    res.status(200).json({
      message: "Token rafraîchi",
      accessToken: token,
    });
  },
};

export default AuthController;
