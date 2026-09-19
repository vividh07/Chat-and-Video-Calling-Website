import mongoose, { Document, Schema } from "mongoose";

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequestDocument extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const friendRequestSchema = new Schema<FriendRequestDocument>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

const FriendRequestModel = mongoose.model<FriendRequestDocument>(
  "FriendRequest",
  friendRequestSchema
);

export default FriendRequestModel;
