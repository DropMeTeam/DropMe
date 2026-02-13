import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import api from "../lib/api";

function routeByRole(role) {
  if (role === "ADMIN_TRAIN") return "/train/stations";
  if (role === "ADMIN_BUS") return "/bus";
  if (role === "ADMIN_PRIVATE") return "/private";
  if (role === "SYSTEM_ADMIN") return "/system/approvals";
  // if you still have SUPER_ADMIN in DB
  if (role === "SUPER_ADMIN") return "/system/approvals";
  return "/login";
}

export default function Login() {
  const nav = useNavigate();
  const { login: normalLogin, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [asSystemAdmin, setAsSystemAdmin] = useState(false);

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (asSystemAdmin) {
        // ✅ SYSTEM_ADMIN uses env-based endpoint
        await api.post("/api/auth/system/login", { email, password });
      } else {
        // ✅ normal admins/users
        await normalLogin(email, password);
      }

      // refresh context + get role
      await refresh?.();

      const meRes = await api.get("/api/auth/me");
      const u = meRes.data?.user || meRes.data;
      nav(routeByRole(u?.role), { replace: true });
    } catch (err) {
      setMsg(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Admin Login</h2>

      {msg && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            padding: 10,
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          {msg}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={asSystemAdmin}
            onChange={(e) => setAsSystemAdmin(e.target.checked)}
          />
          Login as <b>SYSTEM_ADMIN</b> (env credentials)
        </label>

        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button
          disabled={loading}
          type="submit"
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #111", cursor: "pointer" }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: 14, opacity: 0.8 }}>
        New admin? <Link to="/register">Request Admin Access</Link>
      </p>

      <p style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
        Note: Train/Bus/Private admins may need SYSTEM_ADMIN approval before login.
      </p>
    </div>
  );
}
