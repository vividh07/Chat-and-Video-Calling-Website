import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Avatar } from "../components/Avatar";
import type { RelationshipStatus, User } from "../types";

export function UserProfilePage() {
  const { userId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [relationship, setRelationship] = useState<RelationshipStatus>("none");
  const [canMessage, setCanMessage] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!token || !userId) return;
    try {
      const data = await api<{
        user: User;
        relationship: { status: RelationshipStatus };
        canMessage: boolean;
      }>(`/users/${userId}`, { token });
      setProfile(data.user);
      setRelationship(data.relationship.status);
      setCanMessage(data.canMessage);
    } catch (err: any) {
      setError(err?.message || "Failed to load profile");
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, [token, userId]);

  const onMessage = async () => {
    if (!token || !userId) return;
    setBusy(true);
    try {
      const data = await api<{ chat: { _id: string } }>("/chats/private", {
        method: "POST",
        token,
        body: { participantId: userId },
      });
      navigate(`/?chat=${data.chat._id}`);
    } catch (err: any) {
      alert(err?.message || "Cannot message");
    } finally {
      setBusy(false);
    }
  };

  const onRequest = async () => {
    if (!token || !userId) return;
    setBusy(true);
    try {
      await api("/friends/request", {
        method: "POST",
        token,
        body: { userId },
      });
      await load();
    } catch (err: any) {
      alert(err?.message || "Could not send request");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return <div className="glass page-card error-chip">{error}</div>;
  }

  if (!profile) {
    return (
      <div className="glass page-card">
        <p className="page-sub">Loading profile…</p>
      </div>
    );
  }

  return (
    <motion.div
      className="glass page-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="page-card__header">
        <Avatar name={profile.name} avatar={profile.avatar} size="xl" />
        <div>
          <h1 className="page-title">{profile.name}</h1>
          <p className="page-sub">
            {profile.isPrivate ? "Private account" : "Public account"}
            {profile.isOnline ? " · online" : ""}
          </p>
          {profile.bio ? <p>{profile.bio}</p> : null}
        </div>
      </div>

      <div className="people-card__actions" style={{ marginTop: "1rem" }}>
        {canMessage ? (
          <button
            className="glass-btn glass-btn--primary"
            disabled={busy}
            onClick={onMessage}
          >
            <MessageCircle size={14} /> Message
          </button>
        ) : relationship === "outgoing" ? (
          <button className="glass-btn" disabled>
            Request pending
          </button>
        ) : relationship === "incoming" ? (
          <button className="glass-btn" onClick={() => navigate("/requests")}>
            Respond in Requests
          </button>
        ) : relationship !== "self" ? (
          <button className="glass-btn" disabled={busy} onClick={onRequest}>
            <UserPlus size={14} /> Send friend request
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
