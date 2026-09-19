import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  discoverUsers,
  getCurrentUser,
  getUserProfile,
  searchUsers,
  updateAvatar,
  updateProfile,
} from "../services/user.service";
import { uploadImageBuffer } from "../utils/upload";
import { BadRequestException } from "../utils/app-error";

export const getMeController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req.user!._id.toString());
    return res.status(HTTPSTATUS.OK).json({ user });
  }
);

export const searchUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const q = String(req.query.q || "");
    const users = await searchUsers(req.user!._id.toString(), q);
    return res.status(HTTPSTATUS.OK).json({ users });
  }
);

export const discoverUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const users = await discoverUsers(req.user!._id.toString());
    return res.status(HTTPSTATUS.OK).json({ users });
  }
);

export const getUserProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getUserProfile(
      req.user!._id.toString(),
      req.params.userId
    );
    return res.status(HTTPSTATUS.OK).json(result);
  }
);

export const updateProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await updateProfile(req.user!._id.toString(), req.body);
    return res.status(HTTPSTATUS.OK).json({
      message: "Profile updated",
      user,
    });
  }
);

export const uploadAvatarController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestException("Avatar image is required");
    }

    const avatarUrl = await uploadImageBuffer(req.file.buffer, "avatars");
    const user = await updateAvatar(req.user!._id.toString(), avatarUrl);

    return res.status(HTTPSTATUS.OK).json({
      message: "Avatar updated",
      user,
    });
  }
);
