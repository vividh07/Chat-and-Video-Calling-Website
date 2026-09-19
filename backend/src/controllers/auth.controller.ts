import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../services/auth.service";
import { clearAuthCookie, setAuthCookie } from "../utils/cookie";

export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await registerUser(req.body);
    setAuthCookie(res, result.token);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Registered successfully",
      user: result.user,
      token: result.token,
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await loginUser(req.body);
    setAuthCookie(res, result.token);

    return res.status(HTTPSTATUS.OK).json({
      message: "Logged in successfully",
      user: result.user,
      token: result.token,
    });
  }
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response) => {
    if (req.user?._id) {
      await logoutUser(req.user._id.toString());
    }
    clearAuthCookie(res);

    return res.status(HTTPSTATUS.OK).json({
      message: "Logged out successfully",
    });
  }
);
