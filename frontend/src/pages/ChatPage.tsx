import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  Phone,
  Search,
  Send,
  Video,
  X,
} from "lucide-react";
import { Avatar } from "../components/Avatar";
import { CallOverlay, IncomingCallBanner } from "../components/CallOverlay";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useCall } from "../hooks/useCall";
import { api } from "../lib/api";
import {
  chatPeer,
  chatTitle,
  formatTime,
} from "../lib/helpers";
import type { Chat, Message, User } from "../types";

export function ChatPage() {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const callApi = useCall(socket);
  const [searchParams, setSearchParams] = useSearchParams();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    searchParams.get("chat")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [typing, setTyping] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<number | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const activeChat = useMemo(
    () => chats.find((c) => c._id === activeChatId) || null,
    [chats, activeChatId]
  );

  const peer = useMemo(
    () => (activeChat ? chatPeer(activeChat, user?._id) : null),
    [activeChat, user?._id]
  );

  const loadChats = useCallback(async () => {
    if (!token) return;
    const data = await api<{ chats: Chat[] }>("/chats", { token });
    setChats(data.chats);
  }, [token]);

  const loadMessages = useCallback(
    async (chatId: string) => {
      if (!token) return;
      setLoadingMsgs(true);
      try {
        const data = await api<{ messages: Message[] }>(
          `/messages/${chatId}?limit=80`,
          { token }
        );
        setMessages(data.messages);
        await api(`/messages/${chatId}/read`, { method: "PATCH", token });
      } finally {
        setLoadingMsgs(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const fromUrl = searchParams.get("chat");
    if (fromUrl && fromUrl !== activeChatId) {
      setActiveChatId(fromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    loadChats().catch(console.error);
  }, [loadChats]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    loadMessages(activeChatId).catch(console.error);
    socket?.emit("chat:join", activeChatId);

    const onReconnect = () => {
      socket?.emit("chat:join", activeChatId);
    };
    socket?.on("connect", onReconnect);

    return () => {
      socket?.emit("chat:leave", activeChatId);
      socket?.off("connect", onReconnect);
    };
  }, [activeChatId, loadMessages, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!socket) return;

    const resolveChatId = (message: Message) => {
      const raw = message.chat as unknown;
      if (typeof raw === "string") return raw;
      if (raw && typeof raw === "object" && "_id" in (raw as object)) {
        return String((raw as { _id: string })._id);
      }
      return String(raw ?? "");
    };

    const onMessage = (message: Message) => {
      const chatId = resolveChatId(message);

      setChats((prev) => {
        const exists = prev.find((c) => c._id === chatId);
        if (!exists) {
          loadChats().catch(console.error);
          return prev;
        }
        return [
          { ...exists, lastMessage: message, updatedAt: message.createdAt },
          ...prev.filter((c) => c._id !== chatId),
        ];
      });

      if (chatId === activeChatIdRef.current) {
        setMessages((prev) =>
          prev.some((m) => m._id === message._id) ? prev : [...prev, message]
        );
        socket.emit("message:read", chatId);
      }
    };

    const onTypingStart = (payload: { chatId: string; userId: string }) => {
      if (
        String(payload.chatId) === activeChatIdRef.current &&
        payload.userId !== user?._id
      ) {
        setTyping(true);
      }
    };

    const onTypingStop = (payload: { chatId: string; userId: string }) => {
      if (
        String(payload.chatId) === activeChatIdRef.current &&
        payload.userId !== user?._id
      ) {
        setTyping(false);
      }
    };

    const onOnline = ({ userId }: { userId: string }) => {
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          participants: chat.participants.map((p) =>
            p._id === userId ? { ...p, isOnline: true } : p
          ),
        }))
      );
    };

    const onOffline = ({ userId }: { userId: string }) => {
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          participants: chat.participants.map((p) =>
            p._id === userId ? { ...p, isOnline: false } : p
          ),
        }))
      );
    };

    socket.on("message:new", onMessage);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("user:online", onOnline);
    socket.on("user:offline", onOffline);

    return () => {
      socket.off("message:new", onMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("user:online", onOnline);
      socket.off("user:offline", onOffline);
    };
  }, [socket, user?._id, loadChats]);

  useEffect(() => {
    if (!token || query.trim().length < 1) {
      setResults([]);
      return;
    }
    const id = window.setTimeout(async () => {
      try {
        const data = await api<{ users: User[] }>(
          `/users/search?q=${encodeURIComponent(query.trim())}`,
          { token }
        );
        setResults(data.users);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [query, token]);

  const openPrivateChat = async (participantId: string) => {
    if (!token) return;
    try {
      const data = await api<{ chat: Chat }>("/chats/private", {
        method: "POST",
        token,
        body: { participantId },
      });
      setChats((prev) => {
        const others = prev.filter((c) => c._id !== data.chat._id);
        return [data.chat, ...others];
      });
      setActiveChatId(data.chat._id);
      setSearchParams({ chat: data.chat._id });
      setQuery("");
      setResults([]);
    } catch (err: any) {
      // Private account without friendship — send request instead
      try {
        await api("/friends/request", {
          method: "POST",
          token,
          body: { userId: participantId },
        });
        alert(
          err?.message ||
            "This account is private. Friend request sent — message after they accept."
        );
      } catch (reqErr: any) {
        alert(reqErr?.message || err?.message || "Cannot message this user yet");
      }
    }
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onPickImage = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const sendMessage = async () => {
    if (!activeChatId || !socket || !token) return;

    const content = draft.trim();
    if (!content && !imageFile) return;

    setDraft("");
    socket.emit("typing:stop", { chatId: activeChatId });

    try {
      if (imageFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("chatId", activeChatId);

        const uploaded = await api<{ url: string }>("/messages/upload", {
          method: "POST",
          token,
          formData,
        });

        socket.emit("message:send", {
          chatId: activeChatId,
          content: content || "📷 Photo",
          type: "image",
          mediaUrl: uploaded.url,
        });
        clearImage();
      } else {
        socket.emit("message:send", {
          chatId: activeChatId,
          content,
          type: "text",
        });
      }
    } catch (err: any) {
      alert(err?.message || "Failed to send");
    } finally {
      setUploading(false);
    }
  };

  const onDraftChange = (value: string) => {
    setDraft(value);
    if (!socket || !activeChatId) return;
    socket.emit("typing:start", { chatId: activeChatId });
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => {
      socket.emit("typing:stop", { chatId: activeChatId });
    }, 900);
  };

  const startVideo = () => {
    if (!peer || !activeChat) return;
    callApi.startCall({
      id: peer._id,
      name: peer.name,
      chatId: activeChat._id,
    });
  };

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setSearchParams({ chat: chatId });
  };

  return (
    <div className={`chat-layout ${activeChatId ? "is-thread" : ""}`}>
      <aside className="glass sidebar">
        <div className="sidebar__top">
          <div className="brand sidebar__brand">
            chats
          </div>
        </div>

        <div className="me-pill">
          <Avatar name={user?.name} avatar={user?.avatar} />
          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                display: "block",
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name}
            </strong>
            <span style={{ fontSize: "0.75rem", color: "var(--ink-mute)" }}>
              {user?.isPrivate ? "Private" : "Public"}
              {user?.isHidden ? " · Hidden" : ""}
            </span>
          </div>
        </div>

        <div className="search-wrap" style={{ marginTop: "0.9rem" }}>
          <Search size={16} />
          <input
            className="glass-input"
            placeholder="Find people…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {results.length > 0 ? (
          <div className="search-results" style={{ maxHeight: 180, marginBottom: 8 }}>
            <div className="section-label">People</div>
            {results.map((person) => (
              <button
                key={person._id}
                className="search-item"
                onClick={() => openPrivateChat(person._id)}
              >
                <Avatar name={person.name} avatar={person.avatar} />
                <div className="search-item__meta">
                  <strong>{person.name}</strong>
                  <span>{person.email}</span>
                </div>
                {person.isOnline ? <span className="online-dot" /> : null}
              </button>
            ))}
          </div>
        ) : null}

        <div className="section-label">Chats</div>
        <div className="chat-list">
          {chats.length === 0 ? (
            <div className="empty-chats">
              <h3>no waves yet</h3>
              <p>Search someone and start a liquid convo.</p>
            </div>
          ) : (
            chats.map((chat) => {
              const title = chatTitle(chat, user?._id);
              const other = chatPeer(chat, user?._id);
              const preview =
                chat.lastMessage?.type === "image"
                  ? "📷 Photo"
                  : typeof chat.lastMessage?.content === "string"
                    ? chat.lastMessage.content
                    : "Say hello";
              return (
                <button
                  key={chat._id}
                  className={`chat-item ${
                    chat._id === activeChatId ? "is-active" : ""
                  }`}
                  onClick={() => selectChat(chat._id)}
                >
                  <Avatar
                    name={title}
                    avatar={chat.isGroup ? chat.groupAvatar : other?.avatar}
                  />
                  <div className="chat-item__meta">
                    <strong>{title}</strong>
                    <span>{preview}</span>
                  </div>
                  {other?.isOnline ? <span className="online-dot" /> : null}
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="glass thread">
        {!activeChat ? (
          <div className="empty-thread">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>pick a frequency</h3>
              <p>Your conversations float here in frosted glass.</p>
            </motion.div>
          </div>
        ) : (
          <>
            <div className="thread__header">
              <div className="thread__person">
                <button
                  className="glass-btn glass-btn--icon mobile-back"
                  onClick={() => setActiveChatId(null)}
                >
                  <ArrowLeft size={16} />
                </button>
                <Avatar
                  name={chatTitle(activeChat, user?._id)}
                  avatar={
                    activeChat.isGroup
                      ? activeChat.groupAvatar
                      : peer?.avatar
                  }
                  size="lg"
                />
                <div>
                  <h2>{chatTitle(activeChat, user?._id)}</h2>
                  <p>
                    {peer?.isOnline
                      ? "Active now"
                      : peer
                        ? "Away"
                        : `${activeChat.participants.length} people`}
                  </p>
                </div>
              </div>
              <div className="thread__actions">
                {peer ? (
                  <>
                    <button
                      className="glass-btn glass-btn--icon"
                      onClick={startVideo}
                      title="Video call"
                    >
                      <Video size={16} />
                    </button>
                    <button
                      className="glass-btn glass-btn--icon"
                      onClick={startVideo}
                      title="Call"
                    >
                      <Phone size={16} />
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="message-list">
              {loadingMsgs ? (
                <div className="empty-thread">
                  <p>loading sparkles…</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const senderId =
                      typeof message.sender === "string"
                        ? message.sender
                        : message.sender._id;
                    const mine = senderId === user?._id;
                    return (
                      <motion.div
                        key={message._id}
                        className={`message-row ${mine ? "is-mine" : ""}`}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 22 }}
                      >
                        <div className="bubble">
                          {message.type === "image" && message.mediaUrl ? (
                            <a
                              href={message.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bubble-image-link"
                            >
                              <img
                                className="bubble-image"
                                src={message.mediaUrl}
                                alt={message.content || "Shared image"}
                              />
                            </a>
                          ) : null}
                          {message.content && message.type !== "image" ? (
                            message.content
                          ) : message.type === "image" &&
                            message.content &&
                            message.content !== "📷 Photo" ? (
                            <div className="bubble-caption">{message.content}</div>
                          ) : null}
                          <time>{formatTime(message.createdAt)}</time>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="typing">{typing ? "typing…" : ""}</div>

            {imagePreview ? (
              <div className="composer-preview">
                <img src={imagePreview} alt="Selected" />
                <button
                  type="button"
                  className="glass-btn glass-btn--icon"
                  onClick={clearImage}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}

            <div className="composer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="glass-btn glass-btn--icon"
                onClick={() => fileInputRef.current?.click()}
                title="Send image"
                disabled={uploading}
              >
                <ImagePlus size={16} />
              </button>
              <input
                className="glass-input"
                placeholder={
                  imageFile ? "Add a caption (optional)…" : "Write something soft…"
                }
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                disabled={uploading}
              />
              <motion.button
                className="glass-btn glass-btn--primary glass-btn--icon"
                onClick={() => void sendMessage()}
                whileTap={{ scale: 0.94 }}
                disabled={uploading}
                title={uploading ? "Uploading…" : "Send"}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </>
        )}
      </section>

      {callApi.incoming ? (
        <IncomingCallBanner
          name={callApi.incoming.fromName || "Incoming"}
          avatar={callApi.incoming.fromAvatar}
          onAccept={callApi.acceptCall}
          onReject={callApi.rejectCall}
        />
      ) : null}

      <CallOverlay
        active={callApi.call.active}
        peerName={callApi.call.withName}
        localStream={callApi.localStream}
        remoteStream={callApi.remoteStream}
        muted={callApi.call.muted}
        cameraOff={callApi.call.cameraOff}
        onToggleMute={callApi.toggleMute}
        onToggleCamera={callApi.toggleCamera}
        onEnd={callApi.endCall}
      />
    </div>
  );
}
