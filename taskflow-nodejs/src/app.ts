import express from "express";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";
import "./config/passport";
import { generalLimiter } from "./middleware/rateLimiter";

const app = express();
app.use(cors());
app.use(generalLimiter);
app.use(helmet());
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent XSS
      maxAge: 1000 * 60 * 60, // 1 hour
      sameSite: "strict",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(morgan("dev"));

app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "TaskFlow API - TypeScript + Express + PostgreSQL 🐘🚀",
  });
});

app.use("/users", userRoutes);
app.use("/auth", authRoutes);

export default app;
