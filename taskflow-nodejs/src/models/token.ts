// src/models/token.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export type TokenType = "refresh" | "resetPassword" | "verifyEmail";

interface TokenAttributes {
  id: number;
  userId: number;
  tokenHash: string;
  type: TokenType;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
  lastUsedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// For creation (id, timestamps auto-generated)
interface TokenCreationAttributes
  extends Optional<TokenAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Token
  extends Model<TokenAttributes, TokenCreationAttributes>
  implements TokenAttributes
{
  public id!: number;
  public userId!: number;
  public tokenHash!: string;
  public type!: TokenType;
  public deviceInfo?: string | null;
  public ipAddress?: string | null;
  public userAgent?: string | null;
  public expiresAt!: Date;
  public lastUsedAt?: Date | null;
  public revokedAt?: Date | null;
  public revokedReason?: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Token.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "token_hash",
    },
    type: {
      type: DataTypes.ENUM("refresh", "resetPassword", "verifyEmail"),
      allowNull: false,
    },
    deviceInfo: {
      type: DataTypes.TEXT,
      field: "device_info",
    },
    ipAddress: {
      type: DataTypes.STRING, // INET is Postgres-only
      field: "ip_address",
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: "user_agent",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      field: "last_used_at",
    },
  },
  {
    sequelize,
    tableName: "tokens",
    underscored: true,
    timestamps: true, // adds createdAt and updatedAt
  }
);
