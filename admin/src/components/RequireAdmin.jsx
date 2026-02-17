import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

function canAccess(role, section) {
  if (!role) return false;
  if (role === "SYSTEM_ADMIN") return section === "system"; // system admin only sees system pages by default
  if (section === "train") return role === "ADMIN_TRAIN";
  if (section === "bus") return role === "ADMIN_BUS";
  if (section === "private") return role === "ADMIN_PRIVATE";
  if (section === "system") return role === "SYSTEM_ADMIN";
  return false;
}

export default function RequireAdmin({ children, section }) {
  const { user, booting } = useAuth();

  if (booting) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (section && !canAccess(user.role, section)) {
    return (
      <div style={{ padding: 16 }}>
        <h3>Forbidden</h3>
        <p>Your role: <b>{user.role}</b></p>
        <p>Required: <b>{section.toUpperCase()}</b> access</p>
      </div>
    );
  }

  return children;
}
