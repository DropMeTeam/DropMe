import { useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../state/AuthContext";

export default function CreateAdminUser() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN_TRAIN");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    try {
      // Reuse your existing register endpoint
      const res = await api.post("/api/auth/register", {
        fullName,
        email,
        password,
        role, // IMPORTANT: backend must allow role to be set by SUPER_ADMIN (or ignore otherwise)
      });

      setMsg(`Created admin: ${email} (${role})`);
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("ADMIN_TRAIN");
      return res.data;
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to create admin user");
    }
  }

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div style={{ padding: 16 }}>
        <h3>Forbidden</h3>
        <p>Only SUPER_ADMIN can create admin users.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, padding: 16 }}>
      <h3>Create Admin User</h3>
      {msg && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: 10, borderRadius: 8, marginBottom: 10 }}>
          {msg}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Full Name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
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
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }}>
            <option value="ADMIN_TRAIN">ADMIN_TRAIN</option>
            <option value="ADMIN_BUS">ADMIN_BUS</option>
            <option value="ADMIN_PRIVATE">ADMIN_PRIVATE</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </label>

        <button type="submit" style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #111", cursor: "pointer" }}>
          Create
        </button>
      </form>
    </div>
  );
}
