import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../../lib/api";
import TrainScheduleTopBar from "./components/train-schedule-details/TrainScheduleTopBar";
import TrainScheduleHeroSection from "./components/train-schedule-details/TrainScheduleHeroSection";
import TrainScheduleActions from "./components/train-schedule-details/TrainScheduleActions";
import TrainStopsTimelineSection from "./components/train-schedule-details/TrainStopsTimelineSection";
import TrainScheduleStateCard from "./components/train-schedule-details/TrainScheduleStateCard";
import { normalizeDayParamToShort } from "./components/train-schedule-details/trainScheduleDetails.utils";

export default function TrainScheduleDetailsPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Keep the existing URL-driven day selection so the booking flow and detail fetch
  // stay aligned with the current backend contract.
  const rawDayFromUrl = searchParams.get("day") || "";
  const requestedDay = useMemo(
    () => normalizeDayParamToShort(rawDayFromUrl),
    [rawDayFromUrl]
  );

  // Legacy URLs may use full names (e.g. Monday); normalize query to short codes.
  useEffect(() => {
    if (!rawDayFromUrl) return;
    const n = normalizeDayParamToShort(rawDayFromUrl);
    if (n && n !== rawDayFromUrl) {
      const next = new URLSearchParams(searchParams);
      next.set("day", n);
      setSearchParams(next, { replace: true });
    }
  }, [rawDayFromUrl, searchParams, setSearchParams]);

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDetails() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get(`/api/train/schedules/${id}`, {
          params: requestedDay ? { day: requestedDay } : {},
        });

        if (mounted) {
          setSchedule(res.data?.schedule || null);
        }
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.message || "Failed to load schedule");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      mounted = false;
    };
  }, [id, requestedDay]);

  const activeDay = useMemo(() => {
    return requestedDay || schedule?.selectedDay || "";
  }, [requestedDay, schedule?.selectedDay]);

  const handleDayChange = (nextDay) => {
    const nextParams = new URLSearchParams(searchParams);
    const n = normalizeDayParamToShort(nextDay);

    if (n) {
      nextParams.set("day", n);
    } else {
      nextParams.delete("day");
    }

    setSearchParams(nextParams);
  };

  if (loading) {
    return (
      <TrainScheduleStateCard
        tone="loading"
        title="Loading train schedule"
        message="We are pulling the latest route, stops, and operating-day metadata for this service."
      />
    );
  }

  if (error) {
    return (
      <TrainScheduleStateCard
        tone="error"
        title="Unable to load this schedule"
        message={error}
      />
    );
  }

  if (!schedule) {
    return (
      <TrainScheduleStateCard
        tone="empty"
        title="Schedule not found"
        message="The requested train service is unavailable or no longer exists."
      />
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-6 pb-8 text-white">
      <TrainScheduleTopBar />

      <TrainScheduleHeroSection
        schedule={schedule}
        activeDay={activeDay}
        onDayChange={handleDayChange}
      />

      <TrainScheduleActions id={id} day={activeDay} />

      <TrainStopsTimelineSection
        stops={schedule.stops || []}
        segments={schedule.segments || []}
      />
    </div>
  );
}
