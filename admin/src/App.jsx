import { Routes, Route, Navigate } from "react-router-dom";
import AdminNav from "./components/AdminNav.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";

import Login from "./pages/Login.jsx";
import RegisterAdmin from "./pages/RegisterAdmin.jsx";

import TrainLayout from "./pages/train/TrainLayout.jsx";
import StationsPage from "./pages/train/StationsPage.jsx";
import TrainSchedulesPage from "./pages/train/TrainSchedulesPage.jsx";
import TrainTimetablesPage from "./pages/train/TrainTimetablesPage.jsx";

import BusHome from "./pages/bus/BusHome.jsx";
import PrivateHome from "./pages/private/PrivateHome.jsx";
import CreateAdminUser from "./pages/admin/CreateAdminUser.jsx";
import SystemApprovals from "./pages/system/SystemApprovals.jsx";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 16 }}>
      <AdminNav />

      <div style={{ marginTop: 16 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterAdmin />} />

          {/* TRAIN (with tabs via TrainLayout) */}
          <Route
            path="/train"
            element={
              <RequireAdmin section="train">
                <TrainLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="stations" replace />} />
            <Route path="stations" element={<StationsPage />} />
            <Route path="schedules" element={<TrainSchedulesPage />} />
            <Route path="timetables" element={<TrainTimetablesPage />} />
          </Route>

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

          {/* System admin */}
          <Route
            path="/system/approvals"
            element={
              <RequireAdmin section="system">
                <SystemApprovals />
              </RequireAdmin>
            }
          />

          {/* Optional */}
          <Route
            path="/admin/users/new"
            element={
              <RequireAdmin>
                <CreateAdminUser />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<div style={{ padding: 16 }}>Not found</div>} />
        </Routes>
      </div>
    </div>
  );
}
