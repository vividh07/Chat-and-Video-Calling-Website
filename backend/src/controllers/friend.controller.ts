import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  respondToFriendRequest,
  sendFriendRequest,
} from "../services/friend.service";

export const sendRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await sendFriendRequest(
      req.user!._id.toString(),
      req.body.userId
    );
    return res.status(HTTPSTATUS.CREATED).json({
      message: "Friend request sent",
      request,
    });
  }
);

export const acceptRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await respondToFriendRequest(
      req.params.requestId,
      req.user!._id.toString(),
      "accept"
    );
    return res.status(HTTPSTATUS.OK).json({
      message: "Friend request accepted",
      request,
    });
  }
);

export const rejectRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const request = await respondToFriendRequest(
      req.params.requestId,
      req.user!._id.toString(),
      "reject"
    );
    return res.status(HTTPSTATUS.OK).json({
      message: "Friend request rejected",
      request,
    });
  }
);

export const getRequestsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const [incoming, outgoing] = await Promise.all([
      getIncomingRequests(userId),
      getOutgoingRequests(userId),
    ]);
    return res.status(HTTPSTATUS.OK).json({ incoming, outgoing });
  }
);

export const getFriendsController = asyncHandler(
  async (req: Request, res: Response) => {
    const friends = await getFriends(req.user!._id.toString());
    return res.status(HTTPSTATUS.OK).json({ friends });
  }
);
