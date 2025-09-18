import express from "express";
import userRoutes from "./routes/userRoutes";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";



const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow API - TypeScript + Express + PostgreSQL 🐘🚀' });
});

app.use("/users", userRoutes);

export default app;