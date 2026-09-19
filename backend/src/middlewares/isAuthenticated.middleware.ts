import { NextFunction, Request, Response } from "express";
import passport from "../config/passport.config";
import { UnauthorizedException } from "../utils/app-error";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: Error | null, user: Express.User | false) => {
      if (err || !user) {
        return next(new UnauthorizedException("Please login to continue"));
      }
      req.user = user;
      next();
    }
  )(req, res, next);
};
