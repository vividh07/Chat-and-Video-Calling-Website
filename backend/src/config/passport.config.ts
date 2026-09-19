import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { Request } from "express";
import { Env } from "./env.config";
import UserModel from "../models/user.model";

const cookieExtractor = (req: Request) => {
  if (req && req.cookies) {
    return req.cookies.accessToken || null;
  }
  return null;
};

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: Env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await UserModel.findById(payload.userId).select(
          "-password"
        );
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
