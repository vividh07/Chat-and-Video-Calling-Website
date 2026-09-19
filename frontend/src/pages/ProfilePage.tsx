import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Avatar } from "../components/Avatar";
import type { User } from "../types";

export function ProfilePage() {
  const { user, token, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isPrivate, setIsPrivate] = useState(Boolean(user?.isPrivate));
  const [isHidden, setIsHidden] = useState(Boolean(user?.isHidden));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await api<{ user: User }>("/users/me", {
        method: "PATCH",
        token,
        body: { name, bio, isPrivate, isHidden },
      });
      setUser(data.user);
      setMessage("Profile saved");
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="glass page-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="page-card__header">
        <Avatar name={user?.name} avatar={user?.avatar} size="xl" />
        <div>
          <h1 className="page-title">Profile settings</h1>
          <p className="page-sub">
            Control how you show up — public, private, or hidden from browse.
          </p>
        </div>
      </div>

      {error ? <div className="error-chip">{error}</div> : null}
      {message ? <div className="ok-chip">{message}</div> : null}

      <form className="auth-form" onSubmit={onSave}>
        <label>
          Name
          <input
            className="glass-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </label>
        <label>
          Bio
          <textarea
            className="glass-input"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            placeholder="A soft line about you"
          />
        </label>

        <div className="toggle-stack">
          <label className="toggle-row">
            <div>
              <strong>Private account</strong>
              <span>
                Only approved friends can send you direct messages. Public
                accounts can be messaged by anyone.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
          </label>
          <label className="toggle-row">
            <div>
              <strong>Hide profile</strong>
              <span>
                Hidden profiles do not appear on the People page, but can still
                be found with direct search.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isHidden}
              onChange={(e) => setIsHidden(e.target.checked)}
            />
          </label>
        </div>

        <button
          className="glass-btn glass-btn--primary"
          type="submit"
          disabled={busy}
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </motion.div>
  );
}
