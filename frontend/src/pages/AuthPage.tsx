import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { AmbientBackground } from "../components/AmbientBackground";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell auth-page">
      <AmbientBackground />
      <motion.div
        className="glass auth-card"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      >
        <div className="brand">
          Lu<span>ma</span>
        </div>
        <h1>{mode === "login" ? "slide back in" : "start your vibe"}</h1>
        <p className="lead">
          Liquid-glass chat with realtime sparks and face-to-face calls. Built
          soft. Feels premium.
        </p>

        {error ? <div className="error-chip">{error}</div> : null}

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === "register" ? (
            <label>
              Name
              <input
                className="glass-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              className="glass-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.com"
              required
            />
          </label>
          <label>
            Password
            <input
              className="glass-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </label>
          <motion.button
            className="glass-btn glass-btn--primary"
            type="submit"
            disabled={busy}
            whileTap={{ scale: 0.98 }}
          >
            {busy ? "Working…" : mode === "login" ? "Enter Luma" : "Create account"}
          </motion.button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? "New here?" : "Already glowing?"}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
