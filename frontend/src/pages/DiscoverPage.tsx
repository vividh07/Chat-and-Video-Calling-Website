import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Avatar } from "../components/Avatar";
import type { User } from "../types";

export function DiscoverPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<{ users: User[] }>("/users/discover", { token })
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err?.message || "Failed to load people"));
  }, [token]);

  const messageUser = async (userId: string) => {
    if (!token) return;
    setBusyId(userId);
    try {
      const data = await api<{ chat: { _id: string } }>("/chats/private", {
        method: "POST",
        token,
        body: { participantId: userId },
      });
      navigate(`/?chat=${data.chat._id}`);
    } catch (err: any) {
      alert(err?.message || "Cannot message yet");
    } finally {
      setBusyId(null);
    }
  };

  const requestFriend = async (userId: string) => {
    if (!token) return;
    setBusyId(userId);
    try {
      await api("/friends/request", {
        method: "POST",
        token,
        body: { userId },
      });
      alert("Friend request sent");
    } catch (err: any) {
      alert(err?.message || "Could not send request");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <motion.div
      className="glass page-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="page-title">People</h1>
      <p className="page-sub">
        All visible accounts. Hidden profiles never show here — search for them
        directly in chat.
      </p>

      {error ? <div className="error-chip">{error}</div> : null}

      <div className="people-grid">
        {users.map((person) => (
          <div key={person._id} className="people-card glass--thin">
            <Link to={`/users/${person._id}`} className="people-card__main">
              <Avatar name={person.name} avatar={person.avatar} size="lg" />
              <div>
                <strong>{person.name}</strong>
                <span>
                  {person.isPrivate ? "Private" : "Public"}
                  {person.isOnline ? " · online" : ""}
                </span>
                {person.bio ? <p>{person.bio}</p> : null}
              </div>
            </Link>
            <div className="people-card__actions">
              {person.isPrivate ? (
                <button
                  className="glass-btn"
                  disabled={busyId === person._id}
                  onClick={() => requestFriend(person._id)}
                >
                  <UserPlus size={14} /> Request
                </button>
              ) : (
                <button
                  className="glass-btn glass-btn--primary"
                  disabled={busyId === person._id}
                  onClick={() => messageUser(person._id)}
                >
                  <MessageCircle size={14} /> Message
                </button>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && !error ? (
          <p className="page-sub">No visible accounts yet. Invite someone.</p>
        ) : null}
      </div>
    </motion.div>
  );
}
