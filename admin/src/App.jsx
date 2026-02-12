import { Routes, Route, Navigate, Link } from "react-router-dom";
import StationsPage from "./pages/train/StationsPage.jsx";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>DropMe Admin</h2>
        <nav style={{ display: "flex", gap: 10 }}>
          <Link to="/train/stations">Train Stations</Link>
        </nav>
      </header>

      <div style={{ marginTop: 16 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/train/stations" replace />} />
          <Route path="/train/stations" element={<StationsPage />} />
          <Route path="*" element={<div>Not found</div>} />
        </Routes>
      </div>
    </div>
  );
}
