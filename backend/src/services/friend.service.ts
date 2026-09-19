import mongoose from "mongoose";
import FriendRequestModel from "../models/friendRequest.model";
import UserModel from "../models/user.model";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../utils/app-error";

export const areFriends = async (userA: string, userB: string) => {
  const friendship = await FriendRequestModel.findOne({
    status: "accepted",
    $or: [
      { from: userA, to: userB },
      { from: userB, to: userA },
    ],
  });
  return Boolean(friendship);
};

export const getRelationship = async (me: string, other: string) => {
  if (me === other) {
    return { status: "self" as const, requestId: null };
  }

  const request = await FriendRequestModel.findOne({
    $or: [
      { from: me, to: other },
      { from: other, to: me },
    ],
  });

  if (!request) {
    return { status: "none" as const, requestId: null };
  }

  if (request.status === "accepted") {
    return { status: "friends" as const, requestId: request._id.toString() };
  }

  if (request.status === "pending") {
    if (request.from.toString() === me) {
      return {
        status: "outgoing" as const,
        requestId: request._id.toString(),
      };
    }
    return {
      status: "incoming" as const,
      requestId: request._id.toString(),
    };
  }

  return { status: "none" as const, requestId: null };
};

/** Public accounts: anyone can DM. Private: only accepted friends. */
export const canMessageUser = async (fromUserId: string, toUserId: string) => {
  if (fromUserId === toUserId) return false;

  const target = await UserModel.findById(toUserId);
  if (!target) {
    throw new NotFoundException("User not found");
  }

  if (!target.isPrivate) return true;
  return areFriends(fromUserId, toUserId);
};

export const sendFriendRequest = async (fromUserId: string, toUserId: string) => {
  if (fromUserId === toUserId) {
    throw new BadRequestException("Cannot send a request to yourself");
  }
  if (!mongoose.Types.ObjectId.isValid(toUserId)) {
    throw new BadRequestException("Invalid user id");
  }

  const target = await UserModel.findById(toUserId);
  if (!target) {
    throw new NotFoundException("User not found");
  }

  const existing = await FriendRequestModel.findOne({
    $or: [
      { from: fromUserId, to: toUserId },
      { from: toUserId, to: fromUserId },
    ],
  });

  if (existing) {
    if (existing.status === "accepted") {
      throw new BadRequestException("You are already friends");
    }
    if (existing.status === "pending") {
      throw new BadRequestException("A friend request already exists");
    }
    existing.from = new mongoose.Types.ObjectId(fromUserId);
    existing.to = new mongoose.Types.ObjectId(toUserId);
    existing.status = "pending";
    await existing.save();
    return FriendRequestModel.findById(existing._id)
      .populate("from", "name email avatar isPrivate isHidden isOnline")
      .populate("to", "name email avatar isPrivate isHidden isOnline");
  }

  const request = await FriendRequestModel.create({
    from: fromUserId,
    to: toUserId,
    status: "pending",
  });

  return FriendRequestModel.findById(request._id)
    .populate("from", "name email avatar isPrivate isHidden isOnline")
    .populate("to", "name email avatar isPrivate isHidden isOnline");
};

export const respondToFriendRequest = async (
  requestId: string,
  userId: string,
  action: "accept" | "reject"
) => {
  const request = await FriendRequestModel.findById(requestId);
  if (!request) {
    throw new NotFoundException("Friend request not found");
  }

  if (request.to.toString() !== userId) {
    throw new ForbiddenException("Only the recipient can respond");
  }

  if (request.status !== "pending") {
    throw new BadRequestException("Request is no longer pending");
  }

  request.status = action === "accept" ? "accepted" : "rejected";
  await request.save();

  return FriendRequestModel.findById(request._id)
    .populate("from", "name email avatar isPrivate isHidden isOnline")
    .populate("to", "name email avatar isPrivate isHidden isOnline");
};

export const getIncomingRequests = async (userId: string) => {
  return FriendRequestModel.find({ to: userId, status: "pending" })
    .populate("from", "name email avatar isPrivate isHidden isOnline bio")
    .sort({ createdAt: -1 });
};

export const getOutgoingRequests = async (userId: string) => {
  return FriendRequestModel.find({ from: userId, status: "pending" })
    .populate("to", "name email avatar isPrivate isHidden isOnline bio")
    .sort({ createdAt: -1 });
};

export const getFriends = async (userId: string) => {
  const accepted = await FriendRequestModel.find({
    status: "accepted",
    $or: [{ from: userId }, { to: userId }],
  })
    .populate("from", "name email avatar isPrivate isHidden isOnline bio")
    .populate("to", "name email avatar isPrivate isHidden isOnline bio");

  return accepted.map((req) => {
    const from = req.from as any;
    const to = req.to as any;
    return from._id.toString() === userId ? to : from;
  });
};
