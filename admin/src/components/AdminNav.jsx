import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const linkStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  textDecoration: "none",
  fontWeight: 700,
  background: isActive ? "#111" : "transparent",
  color: isActive ? "#fff" : "#111",
});

function RoleNav({ role }) {
  // Train admin sees Train module tabs in TOP NAV
  if (role === "ADMIN_TRAIN") {
    return (
      <>
        <NavLink to="/train/stations" style={linkStyle}>
          Stations
        </NavLink>
        <NavLink to="/train/schedules" style={linkStyle}>
          Schedules
        </NavLink>
      </>
    );
  }

  // Bus admin (placeholder tabs)
  if (role === "ADMIN_BUS") {
    return (
      <>
        <NavLink to="/bus" style={linkStyle}>
          Bus Dashboard
        </NavLink>
        {/* later add: routes, timetables, buses */}
      </>
    );
  }

  // Private admin (placeholder tabs)
  if (role === "ADMIN_PRIVATE") {
    return (
      <>
        <NavLink to="/private" style={linkStyle}>
          Private Dashboard
        </NavLink>
        {/* later add: vehicles, pricing, approvals */}
      </>
    );
  }

  // System admin
  if (role === "SYSTEM_ADMIN") {
    return (
      <>
        <NavLink to="/system/approvals" style={linkStyle}>
          Approvals
        </NavLink>
        {/* Optional future: users, audit logs */}
      </>
    );
  }

  // Default (not logged in / unknown)
  return null;
}

export default function AdminNav() {
  const { user, logout } = useAuth();
  const role = user?.role;
  const location = useLocation();

  return (
    <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <h2 style={{ margin: 0 }}>DropMe Admin</h2>

      {/* Role-based tabs inside top navbar */}
      <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {user ? (
          <RoleNav role={role} />
        ) : (
          // when not logged in, show login/register links
          <>
            <NavLink to="/login" style={linkStyle}>
              Login
            </NavLink>
            <NavLink to="/register" style={linkStyle}>
              Register
            </NavLink>
          </>
        )}
      </nav>

      <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, opacity: 0.85 }}>
              {user.email || "User"} • <b>{user.role}</b>
            </span>
            <button
              onClick={logout}
              style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Logout
            </button>
          </>
        ) : (
          // if user is not logged in and they are not already on login
          location.pathname !== "/login" ? <Link to="/login">Login</Link> : null
        )}
      </div>
    </header>
  );
}
