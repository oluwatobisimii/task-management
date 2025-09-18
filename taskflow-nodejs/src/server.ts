import dotenv from "dotenv";
dotenv.config();


import app from "./app";
import sequelize from "./config/database";

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  console.log("Database synced");
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});