const CLIMATIQ_API_URL = "https://api.climatiq.io/data/v1/estimate";

// Small numeric helper.
function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Estimate emissions for passenger travel over distance.
 * This is the exact shape Climatiq expects for PassengerOverDistance.
 */
export async function estimatePassengerOverDistance({
  activityId,
  distanceKm,
  passengers = 1,
}) {
  const apiKey = process.env.CLIMATIQ_API_KEY;
  const dataVersion = process.env.CLIMATIQ_DATA_VERSION || "32";

  if (!apiKey) {
    throw new Error("Missing CLIMATIQ_API_KEY in server/.env");
  }

  if (!activityId) {
    throw new Error("Missing Climatiq activity ID");
  }

  const safeDistance = Math.max(0, toNumber(distanceKm, 0));
  const safePassengers = Math.max(1, Math.round(toNumber(passengers, 1)));

  const payload = {
    emission_factor: {
      activity_id: activityId,
      data_version: dataVersion,
    },
    parameters: {
      passengers: safePassengers,
      distance: safeDistance,
      distance_unit: "km",
    },
  };

  const response = await fetch(CLIMATIQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      data?.details ||
      `Climatiq request failed with status ${response.status}`;
    throw new Error(message);
  }

  return {
    co2eKg: toNumber(data?.co2e, 0),
    raw: data,
  };
}