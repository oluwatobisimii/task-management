import { UserModel } from "../models";
import { tokenService } from "./tokenService";

export const googleService = {
  async findOrCreate(profile: any) {
    const [user] = await UserModel.findOrCreate({
      where: { googleId: profile.id },
      defaults: {
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value,
      },
    });

    const tokens = {
      accessToken: tokenService.generateAccessToken({ id: user.id }),
      refreshToken: tokenService.generateRefreshToken(user.id),
    };

    return { user, ...tokens };
  },
};
