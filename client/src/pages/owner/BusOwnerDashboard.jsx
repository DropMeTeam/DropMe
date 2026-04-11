import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../state/AuthContext";
import BusOwnerSidebar from "../../components/bus/BusOwner/BusOwnerSidebar";
import MyFleetSection from "../../components/bus/BusOwner/MyFleetSection";
import AddBusSection from "../../components/bus/BusOwner/AddBusSection";
import BusOwnerSchedulesSection from "../../components/bus/BusOwner/BusOwnerSchedulesSection";
import OverviewSection from "../../components/bus/BusOwner/OverviewSection";

const SEAT_OPTIONS = {
  Normal: [42, 44, 49, 54],
  "Semi-luxury": [32, 35, 40],
  Luxury: [45, 49, 50],
  Expressway: [32, 35, 40, 45, 49, 50],
};

export default function BusOwnerDashboard() {
  const { user } = useAuth();

  const [tab, setTab] = useState("overview");
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const [err, setErr] = useState("");
  const [scheduleErr, setScheduleErr] = useState("");

  const [form, setForm] = useState({
    plateNumber: "",
    busType: "Normal",
    seatsTotal: 42,
    color: "",
    routeId: "",
    features: [],
  });

  const [busPhoto, setBusPhoto] = useState(null);
  const [registrationPhoto, setRegistrationPhoto] = useState(null);
  const [permitPhoto, setPermitPhoto] = useState(null);

  const allowedSeats = useMemo(() => {
    return SEAT_OPTIONS[form.busType] || [];
  }, [form.busType]);

  async function loadBuses() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/bus-owner/buses");
      setBuses(data?.buses || []);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load buses"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRoutes() {
    setLoadingRoutes(true);
    setErr("");
    try {
      const { data } = await api.get("/api/bus/routes");
      const list = Array.isArray(data) ? data : data?.routes || [];
      setRoutes(list);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load routes"
      );
    } finally {
      setLoadingRoutes(false);
    }
  }

  async function loadSchedulesForOwnerBuses(busList = []) {
    setLoadingSchedules(true);
    setScheduleErr("");

    try {
      const routeIds = [
        ...new Set(
          busList
            .map((bus) => bus?.routeId?._id || bus?.routeId)
            .filter(Boolean)
            .map(String)
        ),
      ];

      if (routeIds.length === 0) {
        setSchedules([]);
        setLoadingSchedules(false);
        return;
      }

      const responses = await Promise.all(
        routeIds.map((routeId) =>
          api.get(`/api/bus/routes/${routeId}/schedules`)
        )
      );

      const mergedSchedules = responses.flatMap((res, index) => {
        const routeId = routeIds[index];
        const data = res?.data;

        const list = Array.isArray(data)
          ? data
          : data?.schedules || data?.items || [];

        return list.map((item) => ({
          ...item,
          routeId: item?.routeId || routeId,
        }));
      });

      setSchedules(mergedSchedules);
    } catch (e) {
      setSchedules([]);
      setScheduleErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to load schedules"
      );
    } finally {
      setLoadingSchedules(false);
    }
  }

  useEffect(() => {
    loadBuses();
    loadRoutes();
  }, []);

  useEffect(() => {
    if (buses.length > 0) {
      loadSchedulesForOwnerBuses(buses);
    } else {
      setSchedules([]);
      setScheduleErr("");
    }
  }, [buses]);

  useEffect(() => {
    if (!allowedSeats.includes(Number(form.seatsTotal))) {
      setForm((s) => ({
        ...s,
        seatsTotal: allowedSeats[0] || "",
      }));
    }
  }, [form.busType, allowedSeats, form.seatsTotal]);

  function setField(key, value) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function toggleFeature(feature) {
    setForm((prev) => {
      const exists = prev.features.includes(feature);
      return {
        ...prev,
        features: exists
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature],
      };
    });
  }

  async function submitBus(e) {
    e.preventDefault();
    setErr("");

    const seats = Number(form.seatsTotal);

    if (!allowedSeats.includes(seats)) {
      return setErr(`Please select a valid seat count for ${form.busType}`);
    }

    if (!form.plateNumber?.trim()) {
      return setErr("Bus registration number (plateNumber) is required");
    }

    if (!form.routeId) return setErr("Please select a bus route");
    if (!busPhoto) return setErr("Bus photo is required");
    if (!registrationPhoto) return setErr("Bus registration photo is required");
    if (!permitPhoto) return setErr("Bus permit photo is required");

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("plateNumber", form.plateNumber.trim().toUpperCase());
      fd.append("busType", form.busType);
      fd.append("color", form.color || "");
      fd.append("seatsTotal", String(seats));
      fd.append("routeId", form.routeId);

      form.features.forEach((feature) => {
        fd.append("features", feature);
      });

      fd.append("busPhoto", busPhoto);
      fd.append("registrationPhoto", registrationPhoto);
      fd.append("permitPhoto", permitPhoto);

      await api.post("/api/bus-owner/buses", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm({
        plateNumber: "",
        busType: "Normal",
        seatsTotal: 42,
        color: "",
        routeId: "",
        features: [],
      });

      setBusPhoto(null);
      setRegistrationPhoto(null);
      setPermitPhoto(null);

      setTab("mybuses");
      await loadBuses();
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
          e2?.response?.data?.error ||
          "Bus submit failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const approvedCount = buses.filter(
    (bus) => String(bus?.status || "").toLowerCase() === "approved"
  ).length;

  const pendingCount = buses.filter(
    (bus) => String(bus?.status || "").toLowerCase() === "pending"
  ).length;

  const rejectedCount = buses.filter(
    (bus) => String(bus?.status || "").toLowerCase() === "rejected"
  ).length;

  return (
    <div className="flex min-h-screen bg-black text-white">
      <BusOwnerSidebar activeTab={tab} onChangeTab={setTab} />

      <main className="min-h-screen flex-1 bg-[#0a0d12] p-6">
        {err ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {err}
          </div>
        ) : null}

        {tab === "overview" ? (
          <OverviewSection
            user={user}
            buses={buses}
            schedules={schedules}
            onGoToAddBus={() => setTab("add")}
            onGoToSchedules={() => setTab("schedules")}
          />
        ) : null}

        {tab === "profile" ? (
          <div className="rounded-3xl border border-white/10 bg-[#10141b] p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Owner Details</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Name
                </p>
                <p className="mt-2 text-sm text-zinc-200">{user?.name || "-"}</p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Email
                </p>
                <p className="mt-2 text-sm text-zinc-200">{user?.email || "-"}</p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Role
                </p>
                <p className="mt-2 text-sm text-zinc-200">{user?.role || "-"}</p>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "add" ? (
          <AddBusSection
            form={form}
            setField={setField}
            toggleFeature={toggleFeature}
            allowedSeats={allowedSeats}
            routes={routes}
            loadingRoutes={loadingRoutes}
            busPhoto={busPhoto}
            setBusPhoto={setBusPhoto}
            registrationPhoto={registrationPhoto}
            setRegistrationPhoto={setRegistrationPhoto}
            permitPhoto={permitPhoto}
            setPermitPhoto={setPermitPhoto}
            submitBus={submitBus}
            loading={loading}
          />
        ) : null}

        {tab === "mybuses" ? (
          <div className="rounded-3xl border border-white/10 bg-[#10141b] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">My Fleet</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Approved, pending, and rejected buses in one place.
                </p>
              </div>

              <button
                className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-60"
                type="button"
                onClick={loadBuses}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <MyFleetSection buses={buses} />
          </div>
        ) : null}

        {tab === "schedules" ? (
          <div className="space-y-4">
            {scheduleErr ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {scheduleErr}
              </div>
            ) : null}

            <BusOwnerSchedulesSection buses={buses} schedules={schedules} />

            <div className="flex justify-end">
              <button
                className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-60"
                type="button"
                onClick={() => loadSchedulesForOwnerBuses(buses)}
                disabled={loadingSchedules}
              >
                {loadingSchedules ? "Refreshing..." : "Refresh Schedules"}
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}