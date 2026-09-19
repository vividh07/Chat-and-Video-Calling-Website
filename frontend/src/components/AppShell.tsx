import { NavLink, Outlet } from "react-router-dom";
import { MessageCircle, Users, UserRound, UserPlus, LogOut } from "lucide-react";
import { AmbientBackground } from "./AmbientBackground";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export function AppShell() {
  const { logout, user } = useAuth();
  const { connected } = useSocket();

  return (
    <div className="app-shell app-frame">
      <AmbientBackground />
      <nav className="glass topnav">
        <NavLink to="/" className="brand topnav__brand" end>
          Lu<span>ma</span>
        </NavLink>
        <div className="topnav__links">
          <NavLink to="/" end className="topnav__link">
            <MessageCircle size={16} />
            Chats
          </NavLink>
          <NavLink to="/discover" className="topnav__link">
            <Users size={16} />
            People
          </NavLink>
          <NavLink to="/requests" className="topnav__link">
            <UserPlus size={16} />
            Requests
          </NavLink>
          <NavLink to="/profile" className="topnav__link">
            <UserRound size={16} />
            Profile
          </NavLink>
        </div>
        <div className="topnav__meta">
          <span className={`pulse-dot ${connected ? "is-on" : ""}`} />
          <span className="topnav__name">{user?.name}</span>
          <button
            className="glass-btn glass-btn--icon"
            onClick={() => logout()}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
