import { Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

function canAccess(role, section) {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true;
  if (section === "train") return role === "ADMIN_TRAIN";
  if (section === "bus") return role === "ADMIN_BUS";
  if (section === "private") return role === "ADMIN_PRIVATE";
  return false;
}

export default function AdminNav() {
  const { user, logout } = useAuth();
  const role = user?.role;

  return (
    <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <h2 style={{ margin: 0 }}>DropMe Admin</h2>

      <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {canAccess(role, "train") && <Link to="/train/stations">Train</Link>}
        {canAccess(role, "bus") && <Link to="/bus">Bus</Link>}
        {canAccess(role, "private") && <Link to="/private">Private</Link>}
        {role === "SUPER_ADMIN" && <Link to="/admin/users/new">Create Admin</Link>}
      </nav>

      <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, opacity: 0.85 }}>
              {user.email || user.username || "User"} • <b>{user.role}</b>
            </span>
            <button
              onClick={logout}
              style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </header>
  );
}
