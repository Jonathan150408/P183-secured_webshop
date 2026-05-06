import mysql from "mysql2";

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "db_user",
  password: process.env.DB_PASS || "db_password",
  database: process.env.DB_NAME || "webshop",
});

db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données :", err);
    throw err;
  }
  console.log(
    `Connecté à la BDD ${db.config.database} sur ${db.config.host} en tant que ${db.config.user}`,
  );
});

export default db;
