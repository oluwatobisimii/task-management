import { Router } from "express";
import passport from "passport";
import {
  register,
  login,
  logout,
  googleCallback,
  profile,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController";
import {
  authenticateJWT,
  authorizeRoles,
  refreshTokenHandler,
} from "../middleware/auth";
import { loginSchema, registerSchema } from "../validations/authValidation";
import { validate } from "../middleware/validation";

const router = Router();

// Local auth
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

// Refresh token
router.post("/refresh", refreshTokenHandler);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleCallback
);

// Reset Password
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Protected profile
router.get("/profile", authenticateJWT, profile);

// Example: role-based protected route
router.get("/admin", authenticateJWT, authorizeRoles(["admin"]), (req, res) => {
  res.json({ message: "Welcome Admin 🚀" });
});

export default router;
