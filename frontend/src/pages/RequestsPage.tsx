import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Avatar } from "../components/Avatar";
import type { FriendRequest } from "../types";

export function RequestsPage() {
  const { token } = useAuth();
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    if (!token) return;
    try {
      const data = await api<{
        incoming: FriendRequest[];
        outgoing: FriendRequest[];
      }>("/friends/requests", { token });
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    } catch (err: any) {
      setError(err?.message || "Failed to load requests");
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, [token]);

  const respond = async (requestId: string, action: "accept" | "reject") => {
    if (!token) return;
    await api(`/friends/requests/${requestId}/${action}`, {
      method: "POST",
      token,
    });
    await load();
  };

  return (
    <motion.div
      className="glass page-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="page-title">Friend requests</h1>
      <p className="page-sub">
        Private accounts need an approved request before DMs unlock.
      </p>
      {error ? <div className="error-chip">{error}</div> : null}

      <h2 className="section-heading">Incoming</h2>
      <div className="request-list">
        {incoming.map((req) => (
          <div key={req._id} className="request-row glass--thin">
            <Avatar name={req.from.name} avatar={req.from.avatar} />
            <div className="request-row__meta">
              <strong>{req.from.name}</strong>
              <span>{req.from.email}</span>
            </div>
            <button
              className="glass-btn glass-btn--primary"
              onClick={() => respond(req._id, "accept")}
            >
              Accept
            </button>
            <button
              className="glass-btn"
              onClick={() => respond(req._id, "reject")}
            >
              Decline
            </button>
          </div>
        ))}
        {incoming.length === 0 ? (
          <p className="page-sub">No pending requests.</p>
        ) : null}
      </div>

      <h2 className="section-heading">Outgoing</h2>
      <div className="request-list">
        {outgoing.map((req) => (
          <div key={req._id} className="request-row glass--thin">
            <Avatar name={req.to.name} avatar={req.to.avatar} />
            <div className="request-row__meta">
              <strong>{req.to.name}</strong>
              <span>Waiting for approval</span>
            </div>
          </div>
        ))}
        {outgoing.length === 0 ? (
          <p className="page-sub">No outgoing requests.</p>
        ) : null}
      </div>
    </motion.div>
  );
}
