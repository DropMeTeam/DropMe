import { useNavigate } from "react-router-dom";

export default function BusAdminDashboard() {
  const nav = useNavigate();

  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Bus Admin</h2>
        <div style={{ opacity: 0.7, fontSize: 13 }}>Module: Routes • Schedules • Approvals</div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => nav("/bus/routes")}
          style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
        >
          Manage Bus Routes
        </button>

        {/* Future-ready navigation (enable when pages exist) */}
        <button
          onClick={() => nav("/bus/schedules")}
          disabled
          title="Coming next"
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: "not-allowed",
            opacity: 0.6
          }}
        >
          Manage Schedules (Next)
        </button>

        <button
          onClick={() => nav("/bus/approvals")}
          disabled
          title="Coming next"
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: "not-allowed",
            opacity: 0.6
          }}
        >
          Approve Bus Registrations (Next)
        </button>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, background: "#fafafa" }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Operational Workflow</div>
        <div style={{ opacity: 0.8, lineHeight: 1.5 }}>
          1) Create bus routes (NORMAL / EXPRESS) with start, end, and ordered stops. <br />
          2) Drivers register buses to a route (next). <br />
          3) Admin approves buses (next). <br />
          4) Admin publishes schedules per route (next).
        </div>
      </div>

      <div style={{ opacity: 0.75 }}>
        Use <b>Manage Bus Routes</b> to create, review, update, and retire routes. Routes become the foundation for
        bus registrations, schedules, and passenger search flows.
      </div>
    </div>
  );
}