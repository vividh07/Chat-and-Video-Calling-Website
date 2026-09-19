import UserModel from "../models/user.model";
import {
  BadRequestException,
  UnauthorizedException,
} from "../utils/app-error";
import { signToken } from "../utils/jwt";

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new BadRequestException("Email is already registered");
  }

  const user = await UserModel.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
  });

  const token = signToken({ userId: user._id.toString() });
  const safeUser = await UserModel.findById(user._id).select("-password");

  return { user: safeUser, token };
};

export const loginUser = async (data: { email: string; password: string }) => {
  const user = await UserModel.findOne({ email: data.email.toLowerCase() });
  if (!user) {
    throw new UnauthorizedException("Invalid email or password");
  }

  const isMatch = await user.comparePassword(data.password);
  if (!isMatch) {
    throw new UnauthorizedException("Invalid email or password");
  }

  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save();

  const token = signToken({ userId: user._id.toString() });
  const safeUser = await UserModel.findById(user._id).select("-password");

  return { user: safeUser, token };
};

export const logoutUser = async (userId: string) => {
  await UserModel.findByIdAndUpdate(userId, {
    isOnline: false,
    lastSeen: new Date(),
  });
};
