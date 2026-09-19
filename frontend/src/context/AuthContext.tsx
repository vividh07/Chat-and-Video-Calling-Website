import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "luma_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [loading, setLoading] = useState(true);

  const persist = useCallback((nextToken: string | null, nextUser: User | null) => {
    setToken(nextToken);
    setUser(nextUser);
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) {
        if (alive) setLoading(false);
        return;
      }
      try {
        const data = await api<{ user: User }>("/users/me", { token });
        if (alive) setUser(data.user);
      } catch {
        if (alive) persist(null, null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, persist]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      persist(data.token, data.user);
    },
    [persist]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await api<{ user: User; token: string }>("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      persist(data.token, data.user);
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await api("/auth/logout", { method: "POST", token });
      }
    } finally {
      persist(null, null);
    }
  }, [persist, token]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, setUser }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
