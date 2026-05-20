import db from "../config/db.js";

const AdminController = {
  // ----------------------------------------------------------
  // GET /api/admin/users
  // ----------------------------------------------------------
  getUsers: async (req, res) => {
    //get tous les users
    const query = "SELECT id, username, email, role, address FROM users";
    const results = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    //réponse
    res.status(200).json(results);
  },
};

export default AdminController;
