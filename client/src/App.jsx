import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PlanTrip from "./pages/PlanTrip";
import OfferRide from "./pages/driver/OfferRide";
import RiderDashboard from "./pages/rider/RiderDashboard";
import DriverDashboard from "./pages/driver/DriverDashboard";
import { useAuth } from "./state/AuthContext";
import Shell from "./components/Shell";

// ✅ Admin dashboards (NEW files you created in the client app)
import TrainAdminDashboard from "./pages/train/TrainAdminDashboard";
import BusAdminDashboard from "./pages/bus/BusAdminDashboard";
import PrivateAdminDashboard from "./pages/private/PrivateAdminDashboard";

// ✅ Train management pages (your working module)
// If your paths are different, re-upload those files and I’ll adjust imports.
import StationsPage from "./pages/train/StationsPage";
import TrainSchedulesPage from "./pages/train/TrainSchedulesPage";
import TrainTimetablesPage from "./pages/train/TrainTimetablesPage";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ allow, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Landing />} />
        <Route path="/plan" element={<PlanTrip />} />

        {/* ✅ existing rider/driver flows (unchanged) */}
        <Route
          path="/rider"
          element={
            <Protected>
              <RiderDashboard />
            </Protected>
          }
        />
        <Route
          path="/driver"
          element={
            <Protected>
              <DriverDashboard />
            </Protected>
          }
        />
        <Route
          path="/driver/offer"
          element={
            <Protected>
              <OfferRide />
            </Protected>
          }
        />

        {/* ✅ ADMIN ROUTES (new) */}
        <Route
          path="/train"
          element={
            <RequireRole allow={["ADMIN_TRAIN"]}>
              <TrainAdminDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/train/stations"
          element={
            <RequireRole allow={["ADMIN_TRAIN"]}>
              <StationsPage />
            </RequireRole>
          }
        />
        <Route
          path="/train/schedules"
          element={
            <RequireRole allow={["ADMIN_TRAIN"]}>
              <TrainSchedulesPage />
            </RequireRole>
          }
        />
        <Route
          path="/train/timetables"
          element={
            <RequireRole allow={["ADMIN_TRAIN"]}>
              <TrainTimetablesPage />
            </RequireRole>
          }
        />

        <Route
          path="/bus"
          element={
            <RequireRole allow={["ADMIN_BUS"]}>
              <BusAdminDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/private"
          element={
            <RequireRole allow={["ADMIN_PRIVATE"]}>
              <PrivateAdminDashboard />
            </RequireRole>
          }
        />
      </Route>

      {/* auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
