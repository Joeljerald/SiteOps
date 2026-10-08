import dotenv from "dotenv";
import app from "./app.js";
import pool from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

pool.query("SELECT NOW()")
  .then((result) => {
    console.log("PostgreSQL connected successfully");
    console.log("Database time:", result.rows[0].now);
  })
  .catch((error) => {
    console.error("PostgreSQL connection failed:", error);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});