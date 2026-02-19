import { useNavigate } from "react-router-dom";

export default function BusHome() {
  const nav = useNavigate();

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Bus Admin</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => nav("/bus/routes")}
          style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
        >
          Manage Bus Routes
        </button>
      </div>

      <div style={{ opacity: 0.75 }}>
        Use the routes module to create, review, update, and retire bus routes.
      </div>
    </div>
  );
}
