import { Routes, Route, Navigate } from "react-router-dom";
import AdminNav from "./components/AdminNav.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";

import Login from "./pages/Login.jsx";
import StationsPage from "./pages/train/StationsPage.jsx";

import BusHome from "./pages/bus/BusHome.jsx";
import PrivateHome from "./pages/private/PrivateHome.jsx";
import CreateAdminUser from "./pages/admin/CreateAdminUser.jsx";
import RegisterAdmin from "./pages/RegisterAdmin.jsx";
import SystemApprovals from "./pages/system/SystemApprovals.jsx";


export default function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 16 }}>
      <AdminNav />

      <div style={{ marginTop: 16 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/train/stations" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterAdmin />} />

          {/* TRAIN */}
          <Route
            path="/train/stations"
            element={
              <RequireAdmin section="train">
                <StationsPage />
              </RequireAdmin>
            }
          />

          {/* BUS (placeholder) */}
          <Route
            path="/bus"
            element={
              <RequireAdmin section="bus">
                <BusHome />
              </RequireAdmin>
            }
          />

          {/* PRIVATE (placeholder) */}
          <Route
            path="/private"
            element={
              <RequireAdmin section="private">
                <PrivateHome />
              </RequireAdmin>
            }
          />

          {/* Create Admin (SUPER_ADMIN only - enforced inside page too) */}
          <Route
            path="/admin/users/new"
            element={
              <RequireAdmin>
                <CreateAdminUser />
              </RequireAdmin>
            }
          />

          <Route
  path="/system/approvals"
  element={
    <RequireAdmin section="system">
      <SystemApprovals />
    </RequireAdmin>
  }
/>


          <Route path="*" element={<div style={{ padding: 16 }}>Not found</div>} />
        </Routes>
      </div>
    </div>
  );
}
