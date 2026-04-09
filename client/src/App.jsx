import { Navigate, Route, Routes } from "react-router-dom";
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

import CheckoutPage from "./pages/rides/CheckoutPage";
import CheckoutSuccess from "./pages/rides/CheckoutSuccess";
import CheckoutCancel from "./pages/rides/CheckoutCancel";

import Train from "./pages/train-passenger/Train";
import TrainSearchPage from "./pages/train-passenger/TrainSearchPage";
import TrainScheduleDetailsPage from "./pages/train-passenger/TrainScheduleDetailsPage";
import MyTrainBookingsPage from "./pages/train-passenger/MyTrainBookingsPage";
import TrainCheckoutPage from "./pages/train-passenger/TrainCheckoutPage";

import OnboardingPage from "./pages/OnboardingPage";

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
        <Route index element={<OnboardingPage />} />
        <Route path="/plan" element={<PlanTrip />} />

        <Route 
          path="/bus-booking" 
          element={
            <BusBookingPage />
          } 
        />
        <Route 
          path="/bus-booking/details" 
          element={
            <BusBookingDetailsPage />
          } 
        />
        

        <Route
          path="/bus-booking/checkout/success"
          element={
            <Protected>
              <BusCheckoutSuccess />
            </Protected>
          }
        />

        <Route
          path="/bus-booking/checkout/cancel"
          element={
            <Protected>
              <BusCheckoutCancel />
            </Protected>
          }
        />

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

        <Route
          path="/owner"
          element={
            <RequireRole allow={["BUS_OWNER"]}>
              <BusOwnerDashboard />
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