import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { authService } from "../services/authService";
import { tokenService } from "../services/tokenService";

// Registration
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const { user, accessToken, refreshToken } = await authService.register(
      email,
      password,
      name
    );

    const { password: userPassword, ...userWithoutPassword } = user.dataValues;

    res.status(201).json({ user: userWithoutPassword, accessToken, refreshToken });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Local login using Passport
export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    async (err: Error | null, user: Express.User | false, info: any) => {
      if (err || !user) {
        console.log(err, info);
        return res
          .status(401)
          .json({ message: info?.message || "Authentication failed" });
      }

      try {
        const deviceInfo = req.get("User-Agent");
        const ipAddress = req.ip;

        const { accessToken, refreshToken } = await authService.generateTokens(
          user,
          deviceInfo,
          ipAddress
        );
        // Remove password before sending user object
        const { password, ...safeUser } = (user as any).dataValues;
        res.json({
          message: "Login successful",
          user: safeUser,
          accessToken,
          refreshToken,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  )(req, res, next);
};

// Refresh token (delegates to middleware)
export const refresh = (req: Request, res: Response) => {
  // This is handled in middleware.refreshTokenHandler
  return res.status(400).json({ message: "Use /auth/refresh endpoint" });
};

// Logout
export const logout = (req: Request, res: Response) => {
  req.logout(() => {
    res.json({ message: "Logged out successfully" });
  });
};

// Google OAuth callback
export const googleCallback = (req: Request, res: Response) => {
  const user = req.user as any;
  if (!user) return res.status(401).json({ error: "Google login failed" });

  const deviceInfo = req.get("User-Agent");
        const ipAddress = req.ip;

  const accessToken = tokenService.generateAccessToken({
    id: user.id,
    role: user.role,
  });
  const refreshToken = tokenService.generateRefreshToken(user.id, deviceInfo, ipAddress);

  res.json({ user, accessToken, refreshToken });
};

// Get user profile (protected)
export const profile = (req: Request, res: Response) => {
  res.json({ user: req.user });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const token = await authService.createResetToken(email);

    // TODO: send via email
    // Example: send link: https://yourfrontend.com/reset-password?token=${token}
    console.log(
      `Password reset link: ${process.env.FRONTEND_URL}/reset-password?token=${token}`
    );

    res.json({ message: "Password reset link sent to email" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const user = await authService.resetPassword(token, newPassword);

    res.json({ message: "Password reset successful", user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
