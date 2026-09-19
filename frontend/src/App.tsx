import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { AppShell } from "./components/AppShell";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { RequestsPage } from "./pages/RequestsPage";
import { UserProfilePage } from "./pages/UserProfilePage";

function Gate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell auth-page">
        <div className="brand" style={{ fontSize: "2rem" }}>
          Lu<span>ma</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <SocketProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:userId" element={<UserProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  );
}
