export function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function chatTitle(
  chat: {
    isGroup: boolean;
    groupName?: string | null;
    participants: { _id: string; name: string }[];
  },
  myId?: string
) {
  if (chat.isGroup) return chat.groupName || "Group";
  const other = chat.participants.find((p) => p._id !== myId);
  return other?.name || "Chat";
}

export function chatPeer(
  chat: {
    isGroup: boolean;
    participants: {
      _id: string;
      name: string;
      avatar?: string | null;
      isOnline?: boolean;
      email?: string;
    }[];
  },
  myId?: string
) {
  if (chat.isGroup) return null;
  return chat.participants.find((p) => p._id !== myId) || null;
}
