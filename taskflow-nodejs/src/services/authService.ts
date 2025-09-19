import { tokenService } from "./tokenService";
import { UserModel, TokenModel } from "../models";
import { comparePassword, hashPassword } from "../utils/hashPassword";
import { Op } from "sequelize";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const authService = {
  async register(email: string, password: string, name: string) {
    const existingUser = await UserModel.findOne({ where: { email } });
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await hashPassword(password);
    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      name,
    });

    const accessToken = await tokenService.generateAccessToken({ id: newUser.id });
    const refreshToken = await tokenService.generateRefreshToken(newUser.id);

    return { user: newUser, accessToken, refreshToken };
  },

  async login(
    email: string,
    password: string,
    deviceInfo?: string,
    ipAddress?: string
  ) {
    const user = await UserModel.findOne({ where: { email } });
    if (!user) throw new Error("Invalid credentials");
    const isMatch = await comparePassword(password, user.password as string);
    if (!isMatch) throw new Error("Invalid credentials");

    const accessToken = tokenService.generateAccessToken({ id: user.id });
    const refreshToken = tokenService.generateRefreshToken(
      user.id,
      deviceInfo,
      ipAddress
    );
    const userExcluded = user.get({ plain: true });
    delete userExcluded.password;

    return { user: userExcluded, accessToken, refreshToken };
  },

  async validateUser(email: string, password: string) {
    const user = await UserModel.findOne({ where: { email } });
    if (!user || typeof user.password !== "string") return null;

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return null;

    return user;
  },

  async generateTokens(user: any, deviceInfo?: string, ipAddress?: string) {
    const payload = { id: user.id, email: user.email };
    const accessToken = tokenService.generateAccessToken(payload);
    const refreshToken = await tokenService.generateRefreshToken(
      user.id,
      deviceInfo,
      ipAddress
    );
    return { accessToken, refreshToken };
  },

  async createResetToken(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await UserModel.findOne({ where: { email } });
    if (!user) throw new Error("User not found");

    // Invalidate any existing reset tokens for this user
    await TokenModel.update(
      {
        expiresAt: new Date(), // Set to expired
        lastUsedAt: new Date(),
      },
      {
        where: {
          userId: user.id,
          type: "resetPassword",
          expiresAt: { [Op.gt]: new Date() }, // Only expire non-expired tokens
        },
      }
    );

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Create new reset token with 1 hour expiration
    await TokenModel.create({
      userId: user.id,
      tokenHash: hashedToken,
      type: "resetPassword",
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    return rawToken; // send this raw token via email
  },

  async resetPassword(token: string, newPassword: string, ipAddress?: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid reset token
    const resetToken = await TokenModel.findOne({
      where: {
        tokenHash: hashedToken,
        type: "resetPassword",
        expiresAt: { [Op.gt]: new Date() }, // not expired
      },
    });

    if (!resetToken) {
      throw new Error("Invalid or expired reset token");
    }

    // Get the user
    const user = await UserModel.findByPk(resetToken.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update password using the hash utility
    const hashedPassword = await hashPassword(newPassword);
    await user.update({ password: hashedPassword });

    // Mark the reset token as used by setting expiration to now
    await resetToken.update({
      expiresAt: new Date(), // Mark as expired
      lastUsedAt: new Date(),
    });

    // Optionally: Revoke all refresh tokens for security
    await TokenModel.update(
      { expiresAt: new Date() },
      {
        where: {
          userId: user.id,
          type: "refresh",
          expiresAt: { [Op.gt]: new Date() },
        },
      }
    );

    // Return user without password
    const userResponse = user.get({ plain: true });
    delete userResponse.password;

    return userResponse;
  },

  // Clean expired reset tokens (can be run as a cron job)
  async cleanExpiredResetTokens(): Promise<number> {
    const deletedCount = await TokenModel.destroy({
      where: {
        type: "resetPassword",
        expiresAt: { [Op.lt]: new Date() },
      },
    });
    return deletedCount;
  },

  // Check if user has pending reset token
  async hasPendingResetToken(email: string): Promise<boolean> {
    const user = await UserModel.findOne({ where: { email } });
    if (!user) return false;

    const activeToken = await TokenModel.findOne({
      where: {
        userId: user.id,
        type: "resetPassword",
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    return !!activeToken;
  },

  // Rate limiting: prevent too many reset requests
  async canRequestReset(
    email: string,
    windowMinutes: number = 15,
    maxAttempts: number = 3
  ): Promise<boolean> {
    const user = await UserModel.findOne({ where: { email } });
    if (!user) return true; // Allow request for non-existent users (don't reveal if user exists)

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const recentTokens = await TokenModel.count({
      where: {
        userId: user.id,
        type: "resetPassword",
        createdAt: { [Op.gte]: windowStart },
      },
    });

    return recentTokens < maxAttempts;
  },
};
