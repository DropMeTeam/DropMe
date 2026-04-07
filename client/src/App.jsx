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

import DriverRegistrationPage from "./pages/driver/DriverRegistrationPage";
import PrivateDriverApprovalsPage from "./pages/private/PrivateDriverApprovalsPage";

import TrainAdminDashboard from "./pages/train/TrainAdminDashboard";
import TrainAdminLayout from "./pages/train/TrainAdminLayout";
import BusAdminDashboard from "./pages/bus/BusAdminDashboard";
import PrivateAdminDashboard from "./pages/private/PrivateAdminDashboard";

import StationsPage from "./pages/train/StationsPage";
import TrainSchedulesPage from "./pages/train/TrainSchedulesPage";
import TrainTimetablesPage from "./pages/train/TrainTimetablesPage";
import TrainTicketVerifyPage from "./pages/train/TrainTicketVerifyPage";

import Train from "./pages/train-passenger/Train";
import TrainSearchPage from "./pages/train-passenger/TrainSearchPage";
import TrainScheduleDetailsPage from "./pages/train-passenger/TrainScheduleDetailsPage";
import MyTrainBookingsPage from "./pages/train-passenger/MyTrainBookingsPage";
import TrainCheckoutPage from "./pages/train-passenger/TrainCheckoutPage";

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
        <Route path="/trains" element={<Train />} />
        <Route path="/train-service" element={<TrainSearchPage />} />
        <Route path="/train-service/:id" element={<TrainScheduleDetailsPage />} />
        <Route
          path="/train-service/:id/book"
          element={
            <Protected>
              <TrainCheckoutPage />
            </Protected>
          }
        />
        <Route
          path="/train-service/bookings"
          element={
            <Protected>
              <MyTrainBookingsPage />
            </Protected>
          }
        />

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
          path="/train"
          element={
            <RequireRole allow={["ADMIN_TRAIN"]}>
              <TrainAdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<TrainAdminDashboard />} />
          <Route path="stations" element={<StationsPage />} />
          <Route path="schedules" element={<TrainSchedulesPage />} />
          <Route path="timetables" element={<TrainTimetablesPage />} />
          <Route path="ticket-verify" element={<TrainTicketVerifyPage />} />
        </Route>

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
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}