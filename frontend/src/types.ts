export type User = {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string;
  isPrivate?: boolean;
  isHidden?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
};

export type RelationshipStatus =
  | "self"
  | "none"
  | "friends"
  | "outgoing"
  | "incoming";

export type Message = {
  _id: string;
  chat: string;
  sender: User | string;
  content: string;
  type: "text" | "image" | "file" | "system";
  mediaUrl?: string | null;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
};

export type Chat = {
  _id: string;
  participants: User[];
  lastMessage?: Message | null;
  isGroup: boolean;
  groupName?: string | null;
  groupAvatar?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type FriendRequest = {
  _id: string;
  from: User;
  to: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};
