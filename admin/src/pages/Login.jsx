import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      await login(email, password);
      nav("/train/stations");
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
        <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: 10, borderRadius: 8, marginBottom: 10 }}>
          {msg}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
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
        Use an account with role <b>ADMIN_TRAIN</b> (or adjust the required roles in code).
      </p>
    </div>
  );
}
