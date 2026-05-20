const db = require("../config/db");

module.exports = {
  // ----------------------------------------------------------
  // GET /api/profile
  // ----------------------------------------------------------
  get: async (req, res) => {
    const user = req.user;

    //get others infos

    //return the user infos
    return res.status(200).json(user);
  },

  // ----------------------------------------------------------
  // POST /api/profile
  // ----------------------------------------------------------
  update: (req, res) => {
    const userId = DEFAULT_USER_ID;
    const { address } = req.body;

    db.query(
      "UPDATE users SET address = ? WHERE id = ?",
      [address, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json({ message: "Profil mis à jour" });
      },
    );
  },

  // ----------------------------------------------------------
  // POST /api/profile/photo
  // ----------------------------------------------------------
  uploadPhoto: (req, res) => {
    const userId = DEFAULT_USER_ID; // TODO exercice 5 : remplacer par req.user.id

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }

    const photoPath = "/uploads/" + req.file.filename;

    db.query(
      "UPDATE users SET photo_path = ? WHERE id = ?",
      [photoPath, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json({ message: "Photo mise à jour", photo_path: photoPath });
      },
    );
  },
};
