import UserModel from "./user";
import { Token as TokenModel } from "./token";

// Define associations
UserModel.hasMany(TokenModel, {
  foreignKey: "userId",
  as: "tokens",
});

TokenModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "user",
});

export { UserModel, TokenModel };
