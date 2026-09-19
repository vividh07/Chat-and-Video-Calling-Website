import UserModel from "../models/user.model";
import { NotFoundException } from "../utils/app-error";
import { canMessageUser, getRelationship } from "./friend.service";

export const getCurrentUser = async (userId: string) => {
  const user = await UserModel.findById(userId).select("-password");
  if (!user) {
    throw new NotFoundException("User not found");
  }
  return user;
};

export const searchUsers = async (userId: string, query: string) => {
  // Direct search can find hidden profiles
  const users = await UserModel.find({
    _id: { $ne: userId },
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  })
    .select("-password")
    .limit(20);

  return users;
};

/** Browse page — excludes hidden accounts */
export const discoverUsers = async (userId: string) => {
  return UserModel.find({
    _id: { $ne: userId },
    isHidden: false,
  })
    .select("-password")
    .sort({ name: 1 })
    .limit(100);
};

export const getUserProfile = async (viewerId: string, targetId: string) => {
  const user = await UserModel.findById(targetId).select("-password");
  if (!user) {
    throw new NotFoundException("User not found");
  }

  const relationship = await getRelationship(viewerId, targetId);
  const canMessage = await canMessageUser(viewerId, targetId);

  return {
    user,
    relationship,
    canMessage,
  };
};

export const updateProfile = async (
  userId: string,
  data: {
    name?: string;
    avatar?: string | null;
    bio?: string;
    isPrivate?: boolean;
    isHidden?: boolean;
  }
) => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new NotFoundException("User not found");
  }

  return user;
};

export const updateAvatar = async (userId: string, avatarUrl: string) => {
  return updateProfile(userId, { avatar: avatarUrl });
};
