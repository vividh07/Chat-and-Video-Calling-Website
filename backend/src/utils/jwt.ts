import jwt, { SignOptions } from "jsonwebtoken";
import { Env } from "../config/env.config";

export type JwtPayload = {
  userId: string;
};

export const signToken = (payload: JwtPayload) => {
  const options: SignOptions = {
    expiresIn: Env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, Env.JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, Env.JWT_SECRET) as JwtPayload;
};
