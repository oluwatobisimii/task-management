import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class UserModel extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public password?: string;
  public googleId?: string;
  public provider!: "local" | "google";
  public lastLogin?: Date;
}

UserModel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: true },
    googleId: { type: DataTypes.STRING, allowNull: true, unique: true },
    provider: {
      type: DataTypes.ENUM("local", "google"),
      allowNull: false,
      defaultValue: "local",
    },
    lastLogin: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "users" }
);

export default UserModel;
