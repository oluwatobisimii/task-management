import passport from "passport";
import {Strategy} from "passport-local";
import { UserModel } from "../models";

passport.use(new Strategy(
  { usernameField: "email", passwordField: "password" },
  async (email, password, done) => {
    try {
      // Replace with your user lookup logic
      const user = await UserModel.findOne({ where: { email } });
      if (!user) return done(null, false, { message: "Incorrect email." });
      // Add password verification logic here
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

export default passport;