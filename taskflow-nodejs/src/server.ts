import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import sequelize from "./config/database";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // test DB connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // ❌ remove sequelize.sync()
    // migrations handle schema now

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
}

startServer();
