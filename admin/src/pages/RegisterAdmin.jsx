import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function RegisterAdmin() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN_TRAIN");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        name,          // ⚠️ use "name" because your backend uses body.name in register
        email,
        password,
        role,
      });

      const pending = res.data?.pending;
      setMsg(
        pending
          ? "Request submitted. Wait for SYSTEM_ADMIN approval, then login."
          : "Registered successfully. Now login."
      );

      // optional: auto go to login after a short time
      setTimeout(() => nav("/login"), 700);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Admin Registration</h2>

      {msg && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: 10, borderRadius: 8, marginBottom: 10 }}>
          {msg}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <label>
          Admin Type
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }}>
            <option value="ADMIN_TRAIN">Train Admin</option>
            <option value="ADMIN_BUS">Bus Admin</option>
            <option value="ADMIN_PRIVATE">Private Admin</option>
          </select>
        </label>

        <button disabled={loading} type="submit" style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #111", cursor: "pointer" }}>
          {loading ? "Submitting..." : "Register"}
        </button>
      </form>

      <p style={{ marginTop: 14, opacity: 0.8 }}>
        After registering, SYSTEM_ADMIN must approve your request before you can login.
      </p>

      <button
        onClick={() => nav("/login")}
        style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
      >
        Back to Login
      </button>
    </div>
  );
}
