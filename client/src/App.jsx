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

// NEW pages
import DriverRegistrationPage from "./pages/driver/DriverRegistrationPage";
import PrivateDriverApprovalsPage from "./pages/private/PrivateDriverApprovalsPage";

// Edit offer page
import EditOffer from "./pages/driver/EditOffer";

// Admin dashboards
import TrainAdminDashboard from "./pages/train/TrainAdminDashboard";
import BusAdminDashboard from "./pages/bus/BusAdminDashboard";
import PrivateAdminDashboard from "./pages/private/PrivateAdminDashboard";

// Train pages
import StationsPage from "./pages/train/StationsPage";
import TrainSchedulesPage from "./pages/train/TrainSchedulesPage";
import TrainTimetablesPage from "./pages/train/TrainTimetablesPage";

// Booking page
import BookRidePage from "./pages/rider/BookRidePage";

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

        {/* rider */}
        <Route
          path="/rider"
          element={
            <Protected>
              <RiderDashboard />
            </Protected>
          }
        />

        {/* ✅ Booking route must be BEFORE "*" */}
        <Route
          path="/rider/book/:offerId"
          element={
            <Protected>
              <BookRidePage />
            </Protected>
          }
        />

        {/* driver */}
        <Route
          path="/driver"
          element={
            <RequireRole allow={["driver"]}>
              <DriverDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/driver/register"
          element={
            <RequireRole allow={["driver"]}>
              <DriverRegistrationPage />
            </RequireRole>
          }
        />

        <Route
          path="/driver/offer"
          element={
            <RequireRole allow={["driver"]}>
              <OfferRide />
            </RequireRole>
          }
        />

        <Route
          path="/driver/offers/:id/edit"
          element={
            <RequireRole allow={["driver"]}>
              <EditOffer />
            </RequireRole>
          }
        />

        {/* ADMIN ROUTES */}
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

        <Route
          path="/private/driver-approvals"
          element={
            <RequireRole allow={["ADMIN_PRIVATE"]}>
              <PrivateDriverApprovalsPage />
            </RequireRole>
          }
        />

        {/* ✅ Catch-all MUST be last inside Shell */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}