const db = require("../config/db");
const argon2 = require("argon2");

module.exports = {
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
        //mot infos utilisateur ok -> connexion
        res.status(200).json({ message: "Connexion réussie" });
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

    //ajouter le poivre au pwd
    const pepper = process.env.PEPPER;
    let passwordWithPepper = password + pepper;
    //hash le pwd
    const hashPassword = await argon2.hash(passwordWithPepper);

    //on s'en fiche que photoPath soit vide pour le moment
    if (!username || !email || !password || !address) {
      return res.status(400).json({ error: "Un des champs requis est vide" });
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
};
