import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { TokenModel } from "../models";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN as string;
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN as string;
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT secrets must be provided in environment variables");
}

export interface JwtPayload {
  id: number;
  [key: string]: any;
}

export const tokenService = {
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
    });
  },

  verifyAccessToken(token: string): any | null {
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      return decoded;
    } catch {
      return null;
    }
  },

  // Generate and store refresh token
  async generateRefreshToken(
    userId: number,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const token = jwt.sign(
      { userId, },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] }
    );

    console.log("Generated refresh token:", userId);

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await TokenModel.create({
      userId,
      tokenHash,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresAt,
      type: "refresh",
    });

    return token;
  },

  // Verify and update refresh token
  async verifyRefreshToken(token: string): Promise<any> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const storedToken = await TokenModel.findOne({
      where: {
        tokenHash,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!storedToken) return null;

    // Update last used
    await storedToken.update({ lastUsedAt: new Date() });

    try {
      const payload = jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET!
      ) as any;
      return payload;
    } catch {
    await storedToken.destroy();
      return null;
    }
  },

  // Clean expired tokens (run as cron job)
  async cleanExpiredTokens(): Promise<number> {
    const result = await TokenModel.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });

    return result;
  },

  // Get user sessions
  async getUserSessions(userId: number): Promise<any[]> {
    return await TokenModel.findAll({
      where: {
        userId,
        expiresAt: { [Op.gt]: new Date() },
      },
      attributes: ["id", "deviceInfo", "ipAddress", "lastUsedAt", "createdAt"],
      order: [["lastUsedAt", "DESC"]],
    });
  },


};
