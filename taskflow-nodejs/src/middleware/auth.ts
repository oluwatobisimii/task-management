import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { tokenService } from "../services/tokenService";

// Role-based access control middleware
export function authorizeRoles(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
}

// JWT authentication middleware using Passport
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: Error | null, user: Express.User | false, info: any) => {
      if (err || !user) {
        return res
          .status(401)
          .json({ message: "Unauthorized: Invalid or expired token" });
      }
      req.user = user;
      next();
    }
  )(req, res, next);
}

// Token refresh handler
export function refreshTokenHandler(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    const payload = tokenService.verifyRefreshToken(refreshToken) as any;

    // Issue new access token
    const accessToken = tokenService.generateAccessToken({
      id: payload.id,
      role: payload.role,
      email: payload.email,
    });

    return res.json({ accessToken });
  } catch (error: any) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
}
