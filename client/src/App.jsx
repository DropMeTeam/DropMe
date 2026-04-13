import { Navigate, Route, Routes, useSearchParams, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PlanTrip from "./pages/PlanTrip";
import OfferRide from "./pages/driver/OfferRide";
import EditOffer from "./pages/driver/EditOffer";
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

import BusOwnerDashboard from "./pages/owner/BusOwnerDashboard";
import BusRoutesPage from "./pages/bus/BusRoutesPage";
import CreateBusRoute from "./pages/bus/CreateBusRoute";
import EditBusRoute from "./pages/bus/EditBusRoute";
import BusApprovals from "./pages/bus/BusApprovals";
import BusSchedulesPage from "./pages/bus/BusSchedulesPage";
import BusBookingPage from "./pages/bus/BusBookingPage";
import BusBookingDetailsPage from "./pages/bus/BusBookingDetailsPage";
import BusCheckoutSuccess from "./pages/bus/BusCheckoutSuccess";
import BusCheckoutCancel from "./pages/bus/BusCheckoutCancel";
import Bus from "./pages/bus/Bus";
import BusTicketPage from "./pages/bus/BusTicketPage";
import MyBusTicketsPage from "./pages/bus/MyBusTicketsPage";

import CheckoutPage from "./pages/rides/CheckoutPage";
import CheckoutSuccess from "./pages/rides/CheckoutSuccess";
import CheckoutCancel from "./pages/rides/CheckoutCancel";

import Train from "./pages/train-passenger/Train";
import TrainSearchPage from "./pages/train-passenger/TrainSearchPage";
import TrainScheduleDetailsPage from "./pages/train-passenger/TrainScheduleDetailsPage";
import MyTrainBookingsPage from "./pages/train-passenger/MyTrainBookingsPage";
import TrainCheckoutPage from "./pages/train-passenger/TrainCheckoutPage";

import OnboardingPage from "./pages/OnboardingPage";

import RiderReviewsPage from "./pages/rider/RiderReviewsPage";
import EcoLeaderboardPage from "./pages/eco/EcoLeaderboardPage";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8">Loading…</div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RequireRole({ allow, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8">Loading…</div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!allow.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

function RootEntry() {
  const [sp] = useSearchParams();

  const pm = sp.get("pm") || "";
  const bookingId = sp.get("bookingId") || "";
  const sessionId = sp.get("session_id") || "";

  function buildQuery(params = {}) {
    const next = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== "") {
        next.set(key, String(value));
      }
    });

    const qs = next.toString();
    return qs ? `?${qs}` : "";
  }

  if (!pm) {
    return <OnboardingPage />;
  }

  if (pm === "ride-success") {
    return (
      <Navigate
        to={`/checkout/success${buildQuery({
          bookingId,
          session_id: sessionId,
        })}`}
        replace
      />
    );
  }

  if (pm === "ride-cancel") {
    return (
      <Navigate
        to={`/checkout/cancel${buildQuery({
          bookingId,
        })}`}
        replace
      />
    );
  }

  if (pm === "bus-success") {
    return (
      <Navigate
        to={`/buses/checkout/success${buildQuery({
          bookingId,
          session_id: sessionId,
        })}`}
        replace
      />
    );
  }

  if (pm === "bus-cancel") {
    return (
      <Navigate
        to={`/buses/checkout/cancel${buildQuery({
          bookingId,
        })}`}
        replace
      />
    );
  }

  if (pm === "train-success") {
    return (
      <Navigate
        to={`/train-service/bookings${buildQuery({
          payment: "success",
          bookingId,
          session_id: sessionId,
        })}`}
        replace
      />
    );
  }

  if (pm === "train-cancel") {
    return (
      <Navigate
        to={`/train-service/bookings${buildQuery({
          payment: "cancelled",
          bookingId,
        })}`}
        replace
      />
    );
  }

  return <OnboardingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<RootEntry />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* General */}
        <Route path="/plan" element={<PlanTrip />} />
        <Route path="/carpooling" element={<LandingPage />} />

        {/* Bus passenger flow */}
        <Route path="/buses" element={<Bus />} />
        <Route path="/buses/search" element={<BusBookingPage />} />
        <Route path="/buses/search/details" element={<BusBookingDetailsPage />} />

        <Route
          path="/buses/checkout/success"
          element={
            <Protected>
              <BusCheckoutSuccess />
            </Protected>
          }
        />
        <Route
          path="/buses/checkout/cancel"
          element={
            <Protected>
              <BusCheckoutCancel />
            </Protected>
          }
        />
        <Route
          path="/buses/tickets"
          element={
            <Protected>
              <MyBusTicketsPage />
            </Protected>
          }
        />
        <Route
          path="/buses/tickets/:bookingId"
          element={
            <Protected>
              <BusTicketPage />
            </Protected>
          }
        />

        {/* Legacy bus routes kept for safe compatibility */}
        <Route path="/bus-booking" element={<BusBookingPage />} />
        <Route path="/bus-booking/details" element={<BusBookingDetailsPage />} />

        {/* Train passenger flow */}
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

        {/* Rider */}
        <Route
          path="/rider"
          element={
            <Protected>
              <RiderDashboard />
            </Protected>
          }
        >
          <Route path="reviews" element={<RiderReviewsPage />} />
        </Route>

        <Route
          path="/eco"
          element={
            <Protected>
              <EcoLeaderboardPage />
            </Protected>
          }
        />

        <Route path="/rider/leaderboard" element={<Navigate to="/eco" replace />} />

        {/* Ride checkout */}
        <Route
          path="/checkout/:offerId"
          element={
            <Protected>
              <CheckoutPage />
            </Protected>
          }
        />

        <Route
          path="/checkout/success"
          element={
            <Protected>
              <CheckoutSuccess />
            </Protected>
          }
        />

        <Route
          path="/checkout/cancel"
          element={
            <Protected>
              <CheckoutCancel />
            </Protected>
          }
        />

        {/* Driver */}
        <Route
          path="/driver"
          element={
            <Protected>
              <DriverDashboard />
            </Protected>
          }
        />

        <Route
          path="/driver/register"
          element={
            <Protected>
              <DriverRegistrationPage />
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

        <Route
          path="/driver/offers/:id/edit"
          element={
            <RequireRole allow={["driver"]}>
              <EditOffer />
            </RequireRole>
          }
        />

        {/* Train admin */}
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

        {/* Bus admin */}
        <Route
          path="/bus"
          element={
            <RequireRole allow={["ADMIN_BUS"]}>
              <BusAdminDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/bus/routes"
          element={
            <RequireRole allow={["ADMIN_BUS"]}>
              <BusRoutesPage />
            </RequireRole>
          }
        />

        <Route
          path="/bus/routes/new"
          element={
            <RequireRole allow={["ADMIN_BUS"]}>
              <CreateBusRoute />
            </RequireRole>
          }
        />

        <Route
          path="/bus/routes/:id"
          element={
            <RequireRole allow={["ADMIN_BUS"]}>
              <EditBusRoute />
            </RequireRole>
          }
        />

        <Route
          path="/bus/approvals"
          element={
            <RequireRole allow={["ADMIN_BUS"]}>
              <BusApprovals />
            </RequireRole>
          }
        />

        <Route
          path="/bus/schedules"
          element={
            <RequireRole allow={["ADMIN_BUS"]}>
              <BusSchedulesPage />
            </RequireRole>
          }
        />

        {/* Private admin */}
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

        {/* Bus owner */}
        <Route
          path="/owner"
          element={
            <RequireRole allow={["BUS_OWNER"]}>
              <BusOwnerDashboard />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}