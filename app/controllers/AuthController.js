const db = require("../config/db");

module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;

    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message, query: query });
      }

      if (results.length === 0) {
        return res
          .status(401)
          .json({ error: "Email ou mot de passe incorrect" });
      }

      res.json({ message: "Connexion réussie", user: results[0] });
      window.location.href = "/"; // ramène sur accueil
    });
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: (req, res) => {
    const { username, email, password, address, photoPath } = req.body;

    //on s'en fiche que photoPath soit vide pour le moment
    if (!username || !email || !password || !address) {
      return res.status(400).json({ error: "Un des champs requis est vide" });
    }

    //id et role sont fixes -> 3 et user
    const query = `INSERT INTO users (id, username, email, password, role, address, photo_path) VALUES (3, '${username}', '${email}', '${password}', 'user', '${address}', '${photoPath}');`;

    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message, query: query });
      } else {
        res.status(201).json({ message: "Création réussie", user: results[0] });
        window.location.href = "/"; // ramène sur accueil
      }
    });
  },
};
