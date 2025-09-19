import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { authService } from "../services/authService";
import { googleService } from "../services/googleService";
import { UserModel } from "../models";

// Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      console.log(email, password);
      
        try {
        const user = await authService.validateUser(email, password);
        if (!user) return done(null, false, { message: "Invalid credentials." });
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await googleService.findOrCreate(profile);
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (jwtPayload, done) => {
      try {
        const user = await UserModel.findOne({ where: { id: jwtPayload.id } });
        if (!user) return done(null, false);
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Serialize/Deserialize (for sessions)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findOne({ where: { id } });
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
